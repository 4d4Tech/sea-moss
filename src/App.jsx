import React, { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';
import gsap from 'gsap';
import { 
  Menu, ShoppingCart, User, Heart, Sparkles, 
  Database, Server, Bot, Code, Box, X, Plus, Minus, ArrowLeft, CheckCircle2, CreditCard,
  Droplet, Shield, Zap, Activity, Leaf, ChevronLeft, ChevronRight,
  Trash2, Edit3, PlusCircle
} from 'lucide-react';
import { app, db, auth, storage, functions } from './firebase';
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Stripe Client Promise
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.STRIPE_PUBLIC_KEY || "pk_test_placeholder");

// ==========================================
// 1. MOCK DATA & DETAILS
// ==========================================
const products = [
  { 
    id: 1, 
    name: 'Golden Sun Gel', 
    flavor: 'Original Gold', 
    price: 29.99, 
    color: '#e5b945', 
    feature3D: true, 
    description: 'Our signature gel sourced from wildcrafted Caribbean gold sea moss. Sourced from the clean, sun-drenched waters of the Caribbean. Rich in essential minerals, neutral in taste, and perfect for mixing into smoothies, teas, or applying topically to soothe dry skin.',
    nutrition: { calories: 5, carbohydrates: '1g', minerals: '92/102', sodium: '5mg', potassium: '12mg', calcium: '8mg' }
  },
  { 
    id: 2, 
    name: 'Elderberry Boost', 
    flavor: 'Immunity Blend', 
    price: 34.99, 
    color: '#4a154b', 
    feature3D: true, 
    description: 'Infused with organic black elderberries for an extra dose of antioxidants and vitamin C. Handcrafted in small batches, this delicious blend is specifically formulated to support a healthy immune response throughout the seasons.',
    nutrition: { calories: 15, carbohydrates: '3g', minerals: '92/102', sodium: '4mg', potassium: '18mg', calcium: '6mg' }
  },
  { 
    id: 3, 
    name: 'Bladderwrack Mix', 
    flavor: 'Ocean Nutrient', 
    price: 32.99, 
    color: '#1b4d2e', 
    feature3D: true, 
    description: 'A powerful synergy of Caribbean gold sea moss, organic bladderwrack, and burdock root. This traditional blend contains all 102 minerals your body needs, helping to support joint health, thyroid function, and natural cellular detox.',
    nutrition: { calories: 8, carbohydrates: '1.5g', minerals: '102/102', sodium: '8mg', potassium: '25mg', calcium: '14mg' }
  },
  { 
    id: 4, 
    name: 'Purple Sea Moss', 
    flavor: 'Antioxidant Rich', 
    price: 36.99, 
    color: '#663399', 
    feature3D: true, 
    description: 'Sourced from deep Caribbean waters, this rare purple variant is dried in the shade to preserve its high content of anthocyanins—powerful antioxidants. Excellent for cellular repair, brain function, and natural cardiovascular health.',
    nutrition: { calories: 6, carbohydrates: '1.2g', minerals: '92/102', sodium: '6mg', potassium: '15mg', calcium: '9mg' }
  },
  { 
    id: 5, 
    name: 'Spirulina Power', 
    flavor: 'Super Green', 
    price: 34.99, 
    color: '#00a86b', 
    feature3D: true, 
    description: 'Supercharged with organic spirulina, this blue-green algae infusion boosts protein and chlorophyll levels. It promotes muscle recovery, iron absorption, and alkalizing energy levels throughout the day.',
    nutrition: { calories: 10, carbohydrates: '1g', minerals: '92/102', sodium: '12mg', potassium: '20mg', calcium: '10mg' }
  },
  { 
    id: 6, 
    name: 'Pineapple Mango', 
    flavor: 'Tropical Infusion', 
    price: 38.99, 
    color: '#ffb347', 
    feature3D: true, 
    description: 'A refreshing blend of gold sea moss gel infused with organic pineapple and mango purées. Naturally sweetened and packed with digestive enzymes like bromelain, it supports gut wellness with a delicious tropical flavor.',
    nutrition: { calories: 25, carbohydrates: '6g', minerals: '92/102', sodium: '3mg', potassium: '22mg', calcium: '5mg' }
  },
  { 
    id: 7, 
    name: 'Vanilla Chai', 
    flavor: 'Warm Spice', 
    price: 35.99, 
    color: '#d2b48c', 
    feature3D: true, 
    description: 'A comforting blend of organic sea moss infused with real Madagascar vanilla beans and traditional warming chai spices (cinnamon, cardamom, ginger). A delicious superfood base for plant-based milks and desserts.',
    nutrition: { calories: 12, carbohydrates: '2g', minerals: '92/102', sodium: '5mg', potassium: '14mg', calcium: '7mg' }
  },
  { 
    id: 8, 
    name: 'Hibiscus Glow', 
    flavor: 'Floral & Tart', 
    price: 34.99, 
    color: '#c94c4c', 
    feature3D: true, 
    description: 'Infused with organic dried hibiscus flowers and rosehips. This floral, tart blend supports natural collagen synthesis, skin elasticity, and cardiovascular wellness while providing a beautiful crimson glow.',
    nutrition: { calories: 14, carbohydrates: '2.5g', minerals: '92/102', sodium: '4mg', potassium: '16mg', calcium: '8mg' }
  },
  { 
    id: 9, 
    name: 'Charcoal Detox', 
    flavor: 'Lemon Cleanse', 
    price: 39.99, 
    color: '#36454f', 
    feature3D: true, 
    description: 'Supercharged with activated coconut charcoal and organic cold-pressed lemon juice. This deep-cleansing gel attracts and binds toxins in the gut, encouraging gentle digestive regulation and skin clarity.',
    nutrition: { calories: 8, carbohydrates: '1.8g', minerals: '92/102', sodium: '6mg', potassium: '11mg', calcium: '4mg' }
  },
];

// ==========================================
// 2. THREE.JS COMPONENTS (R3F)
// ==========================================

const ProceduralJar = ({ color, isHovered, scale = 1, product }) => {
  const groupRef = useRef();
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0, 0.05);
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  const labelTexture = useMemo(() => {
    const flavorText = product ? product.flavor.toUpperCase() : '100% WILDCRAFTED';
    
    // Construct the dynamic SVG string based on product flavor
    const svgString = `
<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="512" viewBox="0 0 1024 512">
  <defs>
    <!-- Rich dark green gradient background -->
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#14261e"/>
      <stop offset="50%" stop-color="#0f1c16"/>
      <stop offset="100%" stop-color="#0a120e"/>
    </linearGradient>
    
    <!-- Gold foil gradient for text and accents -->
    <linearGradient id="goldFoil" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f1c40f"/>
      <stop offset="50%" stop-color="#d4af37"/>
      <stop offset="100%" stop-color="#aa8c2c"/>
    </linearGradient>
  </defs>

  <!-- Base Label Background -->
  <rect width="1024" height="512" fill="url(#bgGradient)"/>
  
  <!-- Outer Gold Border -->
  <rect x="30" y="30" width="964" height="452" fill="none" stroke="url(#goldFoil)" stroke-width="4" rx="15"/>
  
  <!-- Inner Delicate Dashed Border -->
  <rect x="45" y="45" width="934" height="422" fill="none" stroke="url(#goldFoil)" stroke-width="1.5" stroke-dasharray="12 8" rx="10"/>

  <!-- Minimalist Botanical Accent (Top) -->
  <g transform="translate(512, 120)" fill="none" stroke="url(#goldFoil)" stroke-width="2" stroke-linecap="round">
    <path d="M0 0 V 40" />
    <path d="M0 20 C 15 10, 25 20, 25 35 C 25 20, 15 10, 0 20" fill="url(#goldFoil)" fill-opacity="0.2"/>
    <path d="M0 10 C -15 0, -25 10, -25 25 C -25 10, -15 0, 0 10" fill="url(#goldFoil)" fill-opacity="0.2"/>
    <circle cx="0" cy="0" r="4" fill="url(#goldFoil)"/>
  </g>

  <!-- Main Brand Typography -->
  <text x="512" y="270" font-family="Playfair Display, Georgia, serif" font-size="108" font-weight="600" fill="url(#goldFoil)" text-anchor="middle" letter-spacing="14">SEA MOSS</text>
  
  <!-- Subtitle / Modifier -->
  <text x="512" y="340" font-family="Inter, system-ui, sans-serif" font-size="28" font-weight="300" fill="#e8f0eb" text-anchor="middle" letter-spacing="16">${flavorText}</text>

  <!-- Bottom Divider Line -->
  <line x1="362" y1="390" x2="662" y2="390" stroke="url(#goldFoil)" stroke-width="1" opacity="0.6"/>

  <!-- Product Details (Bottom) -->
  <text x="512" y="440" font-family="Inter, system-ui, sans-serif" font-size="22" font-weight="400" fill="#8b9d93" text-anchor="middle" letter-spacing="6">NOURISH &amp; VITALIZE  |  16 OZ</text>
  
  <!-- Decorative side text (rotated) -->
  <text x="-256" y="85" transform="rotate(-90)" font-family="Inter, system-ui, sans-serif" font-size="14" fill="#8b9d93" letter-spacing="8" opacity="0.5">PREMIUM QUALITY</text>
  <text x="256" y="-940" transform="rotate(90)" font-family="Inter, system-ui, sans-serif" font-size="14" fill="#8b9d93" letter-spacing="8" opacity="0.5">OCEAN TO JAR</text>
</svg>
`;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    const texture = new THREE.CanvasTexture(canvas);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      texture.needsUpdate = true;
      URL.revokeObjectURL(url);
    };
    img.src = url;

    return texture;
  }, [product]);

  return (
    <group ref={groupRef} dispose={null} scale={scale}>
      <Float speed={2.5} rotationIntensity={0.3} floatIntensity={0.6}>
        {/* Sea Moss Gel */}
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[1.3, 1.3, 2.8, 32]} />
          <meshPhysicalMaterial color={color} roughness={0.35} transmission={0.25} thickness={1.2} />
        </mesh>

        {/* Glass Jar */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[1.4, 1.4, 3.4, 32]} />
          <meshPhysicalMaterial color="#ffffff" transmission={1} opacity={1} roughness={0.03} ior={1.48} thickness={0.4} clearcoat={1.0} clearcoatRoughness={0.05} />
        </mesh>

        {/* Dynamic SVG Label wrapped around the middle of the jar */}
        <mesh position={[0, -0.2, 0]} rotation={[0, Math.PI, 0]}>
          <cylinderGeometry args={[1.405, 1.405, 1.8, 64, 1, true]} />
          <meshStandardMaterial 
            map={labelTexture} 
            roughness={0.3}
            metalness={0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Neck */}
        <mesh position={[0, 1.8, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 0.4, 32]} />
          <meshPhysicalMaterial transmission={1} roughness={0.08} color="#ffffff" />
        </mesh>

        {/* Lid */}
        <group position={[0, 2.1, 0]}>
          <mesh>
            <cylinderGeometry args={[1.25, 1.25, 0.3, 32]} />
            <meshStandardMaterial color="#dcdcdc" metalness={0.95} roughness={0.15} />
          </mesh>
          {[...Array(20)].map((_, i) => (
            <mesh key={i} position={[Math.sin((i / 20) * Math.PI * 2) * 1.25, 0, Math.cos((i / 20) * Math.PI * 2) * 1.25]}>
              <boxGeometry args={[0.04, 0.3, 0.04]} />
              <meshStandardMaterial color="#c0c0c0" metalness={0.9} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {/* Platform */}
        <mesh position={[0, -2.5, 0]}>
          <cylinderGeometry args={[1.8, 1.8, 0.2, 32]} />
          <meshStandardMaterial color="#0e231d" roughness={0.9} />
        </mesh>
      </Float>
    </group>
  );
};

// ==========================================
// 3. SUB-COMPONENTS
// ==========================================

// Product Card Grid Item Component
const ProductCard = ({ product, index, onOpenDetails, onAddToCart }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef();

  return (
    <div 
      className="card-wrapper" 
      style={{ animationDelay: `${index * 0.08 + 0.15}s` }}
    >
      <div 
        className="product-card" 
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="card-header">
          {product.feature3D && (
            <div className="tech-badge" style={{ cursor: 'pointer' }} onClick={() => onOpenDetails(product)}>
              <Box size={12} style={{ color: 'var(--accent-gold)' }} /> 3D View
            </div>
          )}
          <button className="icon-btn" style={{ marginLeft: 'auto' }}>
            <Heart size={18} fill={isHovered ? 'var(--accent-gold)' : 'none'} color={isHovered ? 'var(--accent-gold)' : 'currentColor'} />
          </button>
        </div>

        {/* Clicking the canvas/main body opens details */}
        <div className="canvas-container" onClick={() => onOpenDetails(product)}>
          <Canvas camera={{ position: [0, 0, 8], fov: 42 }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 5]} intensity={1.2} />
            <directionalLight position={[-10, -10, -5]} intensity={0.6} color={product.color} />
            
            <Suspense fallback={null}>
              <ProceduralJar color={product.color} isHovered={isHovered} scale={0.85} product={product} />
              <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={8} blur={2.2} far={4} />
              <Environment preset="city" />
            </Suspense>
          </Canvas>
        </div>

        <div className="card-info">
          <h3 className="product-title" style={{ cursor: 'pointer' }} onClick={() => onOpenDetails(product)}>
            {product.name}
          </h3>
          <p className="product-subtitle">{product.flavor} | 16 oz</p>
          <div className="card-footer">
            <span className="price">${product.price}</span>
            <button className="add-to-cart" onClick={() => onAddToCart(product, 1)}>
              <ShoppingCart size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Product Details Overlay Modal Component
const DetailsModal = ({ product, onClose, onAddToCart }) => {
  const [detailedProduct, setDetailedProduct] = useState(product);
  const [qty, setQty] = useState(1);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const docRef = doc(db, "products", String(product.id));
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setDetailedProduct({
            ...docSnap.data(),
            id: Number(docSnap.data().id || docSnap.id)
          });
        }
      } catch (err) {
        console.error("Error fetching product details: ", err);
      }
    };
    fetchProductDetails();
  }, [product.id]);

  const handleAdd = () => {
    onAddToCart(detailedProduct, qty);
    onClose();
  };

  return (
    <div className="details-overlay">
      <div className="details-modal">
        <button className="close-btn" onClick={onClose}><X size={20} /></button>
        
        <div className="details-grid">
          <div 
            className="details-canvas-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <Canvas camera={{ position: [0, 0, 7.5], fov: 42 }}>
              <ambientLight intensity={0.7} />
              <directionalLight position={[10, 10, 5]} intensity={1.5} />
              <directionalLight position={[-10, -10, -5]} intensity={0.8} color={detailedProduct.color} />
              <Suspense fallback={null}>
                <ProceduralJar color={detailedProduct.color} isHovered={isHovered} scale={0.9} product={detailedProduct} />
                <ContactShadows position={[0, -2.6, 0]} opacity={0.5} scale={8} blur={2} far={4} />
                <Environment preset="city" />
              </Suspense>
            </Canvas>
          </div>

          <div className="details-info">
            <div className="details-title-group">
              <h2>{detailedProduct.name}</h2>
              <p>{detailedProduct.flavor} Blend</p>
            </div>
            
            <p className="details-desc">{detailedProduct.description}</p>
            
            <div className="nutrition-panel">
              <h4>Nutritional profile (per tbsp)</h4>
              <div className="nutrition-grid">
                <div className="nutrition-item"><span>Calories</span><span>{detailedProduct.nutrition?.calories}</span></div>
                <div className="nutrition-item"><span>Carbs</span><span>{detailedProduct.nutrition?.carbohydrates}</span></div>
                <div className="nutrition-item"><span>Minerals</span><span>{detailedProduct.nutrition?.minerals}</span></div>
                <div className="nutrition-item"><span>Sodium</span><span>{detailedProduct.nutrition?.sodium}</span></div>
                <div className="nutrition-item"><span>Potassium</span><span>{detailedProduct.nutrition?.potassium}</span></div>
                <div className="nutrition-item"><span>Calcium</span><span>{detailedProduct.nutrition?.calcium}</span></div>
              </div>
            </div>

            <div className="purchase-row">
              <span className="price" style={{ fontSize: '1.75rem' }}>
                ${(detailedProduct.price * qty).toFixed(2)}
              </span>

              <div className="quantity-control">
                <button className="qty-btn" onClick={() => setQty(Math.max(1, qty - 1))}><Minus size={16} /></button>
                <span className="qty-val">{qty}</span>
                <button className="qty-btn" onClick={() => setQty(qty + 1)}><Plus size={16} /></button>
              </div>

              <button className="btn btn-primary" onClick={handleAdd} style={{ flexGrow: 1 }}>
                Add To Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Sliding Shopping Cart Drawer Component
const CartDrawer = ({ isOpen, onClose, cart, onUpdateQty, onRemove, onProceedToCheckout }) => {
  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <>
      <div className="cart-drawer-overlay" onClick={onClose}></div>
      <div className="cart-drawer">
        <div className="cart-drawer-header">
          <h2>Your Cart</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="cart-items-list">
          {cart.length === 0 ? (
            <div className="empty-cart-message">
              <ShoppingCart size={48} style={{ color: 'var(--text-muted)' }} />
              <p>Your shopping cart is empty.</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="cart-item-row">
                <div 
                  className="cart-item-color-dot" 
                  style={{ backgroundColor: item.product.color, color: item.product.color }}
                ></div>
                <div className="cart-item-details">
                  <div className="cart-item-name">{item.product.name}</div>
                  <div className="cart-item-flavor">{item.product.flavor}</div>
                  <div className="cart-item-price-qty">
                    <span className="cart-item-price">${item.product.price}</span>
                    <div className="quantity-control" style={{ transform: 'scale(0.85)' }}>
                      <button className="qty-btn" onClick={() => onUpdateQty(item.product.id, item.quantity - 1)}><Minus size={14} /></button>
                      <span className="qty-val">{item.quantity}</span>
                      <button className="qty-btn" onClick={() => onUpdateQty(item.product.id, item.quantity + 1)}><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
                <button className="icon-btn" onClick={() => onRemove(item.product.id)} style={{ color: '#f28b82' }}>
                  <X size={18} />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="cart-summary-box">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span style={{ color: 'var(--primary-teal)' }}>FREE</span>
            </div>
            <div className="cart-summary-row total">
              <span>Total</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary cart-action-btn" onClick={onProceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
};

// Sliding Mobile Navigation Drawer Component
const MobileMenuDrawer = ({ isOpen, onClose, activeView, setActiveView }) => {
  if (!isOpen) return null;

  const handleLinkClick = (view) => {
    setActiveView(view);
    onClose();
  };

  return (
    <>
      <div className="cart-drawer-overlay" onClick={onClose}></div>
      <div className="mobile-menu-drawer">
        <div className="cart-drawer-header">
          <h2>Menu</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="mobile-menu-links">
          <span 
            className={`mobile-menu-link ${activeView === 'shop' ? 'active' : ''}`}
            onClick={() => handleLinkClick('shop')}
          >
            Shop
          </span>
          <span 
            className={`mobile-menu-link ${activeView === 'benefits' ? 'active' : ''}`}
            onClick={() => handleLinkClick('benefits')}
          >
            Benefits
          </span>
          <span 
            className={`mobile-menu-link ${activeView === 'admin' ? 'active' : ''}`}
            onClick={() => handleLinkClick('admin')}
          >
            Admin
          </span>
          <span 
            className="mobile-menu-link"
            onClick={() => handleLinkClick('shop')}
          >
            Our Story
          </span>
        </div>
      </div>
    </>
  );
};

// Stripe Secure Payment Card Handler Form
const PaymentForm = ({ cart, total, shippingInfo, onPaymentSuccess, onBack }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [simulation, setSimulation] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    // If sandbox simulate toggle is checked, mock transaction completes locally
    if (simulation) {
      setTimeout(() => {
        setProcessing(false);
        onPaymentSuccess(`sim_intent_${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      }, 1500);
      return;
    }

    try {
      // Fetch dynamic payment intent client-secret from Cloud Functions backend
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const endpoint = isLocalhost
        ? 'http://127.0.0.1:5001/sea-moss-a798e/us-central1/createPaymentIntent'
        : 'https://us-central1-sea-moss-a798e.cloudfunctions.net/createPaymentIntent';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total }),
      });

      if (!response.ok) {
        throw new Error("Cloud Function endpoint offline. Use 'Payment Simulation' checkbox below to complete flow.");
      }

      const { clientSecret } = await response.json();

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: shippingInfo.name,
            email: shippingInfo.email,
            address: {
              line1: shippingInfo.address,
              city: shippingInfo.city,
              postal_code: shippingInfo.zip,
            }
          },
        },
      });

      if (result.error) {
        setError(result.error.message);
        setProcessing(false);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          setProcessing(false);
          onPaymentSuccess(result.paymentIntent.id);
        }
      }
    } catch (err) {
      setError(err.message);
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-panel">
      <h2>Secure <span>Payment Card</span></h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
        Accepting Visa, Mastercard, AMEX, Discover.
      </p>

      {error && <div className="stripe-error-message">{error}</div>}

      <div className="stripe-simulation-badge">
        <input 
          type="checkbox" 
          id="simulate-toggle"
          checked={simulation}
          onChange={(e) => setSimulation(e.target.checked)}
        />
        <label htmlFor="simulate-toggle" style={{ cursor: 'pointer', fontWeight: 600 }}>
          Enable Payment Simulation (Sandbox Test Bypass)
        </label>
      </div>

      <div className="form-group">
        <label className="form-label">Credit or Debit Card</label>
        <div className="stripe-element-container">
          <CardElement options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#e8f0eb',
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                '::placeholder': { color: '#8b9d93' },
              },
              invalid: { color: '#f28b82' },
            },
          }} />
        </div>
      </div>

      <button 
        type="submit" 
        className="btn btn-primary cart-action-btn"
        disabled={processing || !stripe}
      >
        {processing ? (
          <>
            <span className="pay-btn-loader"></span> Processing Transaction...
          </>
        ) : (
          `Pay $${total.toFixed(2)}`
        )}
      </button>
      
      <button 
        type="button" 
        className="btn btn-secondary cart-action-btn" 
        onClick={onBack}
        style={{ marginTop: '0.5rem' }}
        disabled={processing}
      >
        Back to Shipping Info
      </button>
    </form>
  );
};

// ==========================================
// Benefits View Component
// ==========================================
const BenefitsView = ({ setView }) => {
  const heroRef = useRef();
  const bannerRef = useRef();
  const blocksRef = useRef([]);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Animate Hero
    tl.to(heroRef.current, { x: 0, opacity: 1, duration: 0.8, ease: "power3.out" })
      // Animate Info Banner
      .to(bannerRef.current, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" }, "-=0.4")
      // Animate Feature Blocks (staggered)
      .to(blocksRef.current, { 
        y: 0, 
        opacity: 1, 
        duration: 0.6, 
        stagger: 0.1, 
        ease: "back.out(1.2)" 
      }, "-=0.2");
  }, []);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Section */}
      <div className="benefits-hero">
        <div className="decorative-leaves"></div>
        <div className="benefits-hero-content" ref={heroRef}>
          <h1 className="benefits-title">
            Nature's Ultimate <span>Superfood</span>
          </h1>
          <p className="benefits-subtitle">
            Sea moss contains 92 of the 102 essential minerals our bodies need to function optimally. 
            From thyroid support to glowing skin, discover why this ocean treasure is essential for daily wellness.
          </p>
          <button className="cta-button" onClick={() => setView('shop')}>Shop Collections</button>
        </div>
      </div>

      {/* Main Info Banner */}
      <div className="info-banner" ref={bannerRef}>
        <div className="info-item">
          <div className="info-icon-wrapper"><Shield size={28} /></div>
          <h4>Immune Support</h4>
          <p>Rich in amino acids, Vitamin C, and antioxidants that help fortify the body's natural defense systems.</p>
        </div>
        <div className="info-item">
          <div className="info-icon-wrapper"><Activity size={28} /></div>
          <h4>Thyroid Function</h4>
          <p>An excellent natural source of iodine, crucial for healthy thyroid function and metabolic regulation.</p>
        </div>
        <div className="info-item">
          <div className="info-icon-wrapper"><Zap size={28} /></div>
          <h4>Sustained Energy</h4>
          <p>Contains iron and B-vitamins that help the body create red blood cells to move oxygen effectively.</p>
        </div>
        <div className="info-item">
          <div className="info-icon-wrapper"><Droplet size={28} /></div>
          <h4>Digestive Health</h4>
          <p>Acts as a soothing prebiotic mucilage that feeds good gut bacteria and supports gut lining.</p>
        </div>
      </div>

      {/* Earthy Features Grid */}
      <div className="features-grid">
        <div className="feature-block green" ref={el => blocksRef.current[0] = el}>
          <div className="feature-icon-circle"><Leaf color="#fff" size={24} /></div>
          <h4>100% Wildcrafted</h4>
          <p>Harvested sustainably from unpolluted ocean waters, never pool-grown.</p>
        </div>
        
        <div className="feature-block brown" ref={el => blocksRef.current[1] = el}>
          <div className="feature-icon-circle"><Sparkles color="#fff" size={24} /></div>
          <h4>Collagen Production</h4>
          <p>Promotes healthy skin elasticity, hair growth, and strong nails.</p>
        </div>

        <div className="feature-block gold" ref={el => blocksRef.current[2] = el}>
          <div className="feature-icon-circle"><Heart color="#fff" size={24} /></div>
          <h4>Heart Health</h4>
          <p>Rich in Omega-3 fatty acids to support healthy cholesterol levels.</p>
        </div>

        {/* Decorative Image Block spanning 2 rows */}
        <div className="feature-block image-block" ref={el => blocksRef.current[3] = el}></div>

        <div className="feature-block brown" ref={el => blocksRef.current[4] = el}>
          <div className="feature-icon-circle"><Box color="#fff" size={24} /></div>
          <h4>Post-Workout</h4>
          <p>Helps draw lactic acid out of muscles to speed up physical recovery.</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3.5. PRODUCT MANAGEMENT ADMIN DASHBOARD
// ==========================================
const AdminPanel = ({ productsList, setProductsList }) => {
  const [editingProduct, setEditingProduct] = useState(null);
  const [name, setName] = useState('');
  const [flavor, setFlavor] = useState('');
  const [price, setPrice] = useState('');
  const [color, setColor] = useState('#d4af37');
  const [description, setDescription] = useState('');
  const [calories, setCalories] = useState('');
  const [carbs, setCarbs] = useState('');
  const [minerals, setMinerals] = useState('');
  const [sodium, setSodium] = useState('');
  const [potassium, setPotassium] = useState('');
  const [calcium, setCalcium] = useState('');
  const [feature3D, setFeature3D] = useState(true);

  const handleEditClick = (product) => {
    setEditingProduct(product);
    setName(product.name || '');
    setFlavor(product.flavor || '');
    setPrice(String(product.price || ''));
    setColor(product.color || '#d4af37');
    setDescription(product.description || '');
    setCalories(product.nutrition?.calories || '');
    setCarbs(product.nutrition?.carbohydrates || '');
    setMinerals(product.nutrition?.minerals || '');
    setSodium(product.nutrition?.sodium || '');
    setPotassium(product.nutrition?.potassium || '');
    setCalcium(product.nutrition?.calcium || '');
    setFeature3D(product.feature3D !== false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClear = () => {
    setEditingProduct(null);
    setName('');
    setFlavor('');
    setPrice('');
    setColor('#d4af37');
    setDescription('');
    setCalories('');
    setCarbs('');
    setMinerals('');
    setSodium('');
    setPotassium('');
    setCalcium('');
    setFeature3D(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name || !flavor || !price || !description || !color) {
      alert("Please fill out all required basic fields.");
      return;
    }
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      alert("Please enter a valid positive price.");
      return;
    }

    const productData = {
      name,
      flavor,
      price: numericPrice,
      color,
      description,
      feature3D,
      nutrition: {
        calories: calories || "N/A",
        carbohydrates: carbs || "N/A",
        minerals: minerals || "N/A",
        sodium: sodium || "N/A",
        potassium: potassium || "N/A",
        calcium: calcium || "N/A"
      }
    };

    try {
      if (editingProduct) {
        const updatedProduct = {
          ...productData,
          id: editingProduct.id
        };
        await setDoc(doc(db, "products", String(editingProduct.id)), updatedProduct);
        setProductsList(prev => prev.map(p => p.id === editingProduct.id ? updatedProduct : p));
        alert("Product updated successfully!");
      } else {
        const nextId = productsList.length > 0 
          ? Math.max(...productsList.map(p => p.id)) + 1 
          : 1;
        const newProduct = {
          ...productData,
          id: nextId
        };
        await setDoc(doc(db, "products", String(nextId)), newProduct);
        setProductsList(prev => [...prev, newProduct]);
        alert("Product added successfully!");
      }
      handleClear();
    } catch (err) {
      console.error("Error saving product: ", err);
      alert("Failed to save product. Check console for details.");
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "products", String(productId)));
      setProductsList(prev => prev.filter(p => p.id !== productId));
      alert("Product deleted successfully!");
      if (editingProduct && editingProduct.id === productId) {
        handleClear();
      }
    } catch (err) {
      console.error("Error deleting product: ", err);
      alert("Failed to delete product.");
    }
  };

  return (
    <div className="admin-dashboard animate-fade-in">
      <div className="admin-header">
        <h2>Product Management <span>Dashboard</span></h2>
        <p>Add, edit, or delete organic Sea Moss blends in Firestore</p>
      </div>

      <div className="admin-grid">
        {/* Editor Form Card */}
        <div className="admin-card">
          <h3 className="admin-card-title">
            {editingProduct ? <><Edit3 size={18} /> Edit Product</> : <><PlusCircle size={18} /> Add New Product</>}
          </h3>
          
          <form onSubmit={handleSave} className="admin-form">
            <div className="admin-form-group">
              <label>Product Name *</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                placeholder="e.g. Golden Sun Gel" 
                required 
              />
            </div>

            <div className="admin-form-group">
              <label>Flavor / Blend Subtitle *</label>
              <input 
                type="text" 
                value={flavor} 
                onChange={e => setFlavor(e.target.value)} 
                placeholder="e.g. Organic Mango & Pineapple" 
                required 
              />
            </div>

            <div className="admin-two-cols">
              <div className="admin-form-group">
                <label>Price ($) *</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={price} 
                  onChange={e => setPrice(e.target.value)} 
                  placeholder="28.99" 
                  required 
                />
              </div>
              
              <div className="admin-form-group">
                <label>Jar Color (Hex) *</label>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input 
                    type="color" 
                    value={color} 
                    onChange={e => setColor(e.target.value)}
                    style={{ width: '40px', height: '40px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px', background: 'none' }}
                  />
                  <input 
                    type="text" 
                    value={color} 
                    onChange={e => setColor(e.target.value)} 
                    placeholder="#d4af37" 
                    style={{ flexGrow: 1 }}
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="admin-form-group">
              <label>Description *</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Describe the flavor profile, ingredients, and health benefits..." 
                rows={4}
                required 
              />
            </div>

            <div className="admin-form-group checkbox-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                <input 
                  type="checkbox" 
                  checked={feature3D} 
                  onChange={e => setFeature3D(e.target.checked)} 
                />
                Enable 3D Mason Jar Canvas Preview
              </label>
            </div>

            <div className="nutrition-section-header">
              <h4>Nutritional Profile</h4>
              <p>Provide values representing a single tablespoon serving</p>
            </div>

            <div className="admin-three-cols">
              <div className="admin-form-group">
                <label>Calories</label>
                <input type="text" value={calories} onChange={e => setCalories(e.target.value)} placeholder="e.g. 20 kcal" />
              </div>
              <div className="admin-form-group">
                <label>Carbs</label>
                <input type="text" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="e.g. 5g" />
              </div>
              <div className="admin-form-group">
                <label>Minerals</label>
                <input type="text" value={minerals} onChange={e => setMinerals(e.target.value)} placeholder="e.g. 92 essential" />
              </div>
            </div>

            <div className="admin-three-cols">
              <div className="admin-form-group">
                <label>Sodium</label>
                <input type="text" value={sodium} onChange={e => setSodium(e.target.value)} placeholder="e.g. 15mg" />
              </div>
              <div className="admin-form-group">
                <label>Potassium</label>
                <input type="text" value={potassium} onChange={e => setPotassium(e.target.value)} placeholder="e.g. 85mg" />
              </div>
              <div className="admin-form-group">
                <label>Calcium</label>
                <input type="text" value={calcium} onChange={e => setCalcium(e.target.value)} placeholder="e.g. 1.5%" />
              </div>
            </div>

            <div className="admin-actions">
              <button type="submit" className="btn btn-primary">
                {editingProduct ? "Update Product" : "Add Product"}
              </button>
              <button type="button" className="btn btn-outline" onClick={handleClear} style={{ background: 'none', border: '1px solid var(--card-border)' }}>
                Cancel / Clear
              </button>
            </div>
          </form>
        </div>

        {/* Catalog Manager List Card */}
        <div className="admin-card">
          <h3 className="admin-card-title">Catalog Inventory ({productsList.length})</h3>
          
          <div className="admin-products-list">
            {productsList.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No products found in catalog.</p>
            ) : (
              productsList.map(prod => (
                <div key={prod.id} className="admin-product-row">
                  <div className="admin-prod-preview" style={{ backgroundColor: prod.color }} title={`Color: ${prod.color}`}></div>
                  
                  <div className="admin-prod-info">
                    <h4 className="admin-prod-name">{prod.name}</h4>
                    <p className="admin-prod-flavor">{prod.flavor}</p>
                    <span className="admin-prod-price">${prod.price?.toFixed(2)}</span>
                  </div>

                  <div className="admin-prod-actions">
                    <button 
                      type="button"
                      className="admin-action-btn edit" 
                      onClick={() => handleEditClick(prod)} 
                      title="Edit Product"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      type="button"
                      className="admin-action-btn delete" 
                      onClick={() => handleDelete(prod.id)} 
                      title="Delete Product"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 4. MAIN APP CONTAINER
// ==========================================

const App = () => {
  const [activeView, setActiveView] = useState('shop'); // 'shop', 'checkout', 'payment', 'confirmation'
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Checkout & Shipping forms
  const [shippingInfo, setShippingInfo] = useState({
    name: '', email: '', address: '', city: '', zip: ''
  });
  
  // Completed Order references
  const [completedOrder, setCompletedOrder] = useState(null);

  const [productsList, setProductsList] = useState(products);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 5;
  const [isHeroHovered, setIsHeroHovered] = useState(false);

  // Fetch and Seed Products from Firestore
  useEffect(() => {
    const fetchAndSeedProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        if (querySnapshot.empty) {
          console.log("No products found in Firestore. Seeding products...");
          for (const product of products) {
            await setDoc(doc(db, "products", String(product.id)), product);
          }
          console.log("Seeding complete!");
          setProductsList(products);
        } else {
          const loadedProducts = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            loadedProducts.push({
              ...data,
              id: Number(data.id || doc.id)
            });
          });
          loadedProducts.sort((a, b) => a.id - b.id);
          setProductsList(loadedProducts);
        }
      } catch (error) {
        console.error("Error loading products from Firestore: ", error);
      }
    };

    fetchAndSeedProducts();
  }, []);

  useEffect(() => {
    // Initialize GSAP Animations
    try {
      if (gsap) {
        gsap.fromTo('.animate-fade-in', 
          { opacity: 0, y: 30 }, 
          { opacity: 1, y: 0, duration: 1.2, stagger: 0.15, ease: 'power4.out', delay: 0.1 }
        );
      }
    } catch (e) {
      console.error("GSAP Animation error: ", e);
    }
  }, [activeView]);

  // Cart Handlers
  const handleAddToCart = (product, quantity) => {
    setCart(prevCart => {
      const existing = prevCart.find(item => item.product.id === product.id);
      if (existing) {
        return prevCart.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { product, quantity }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQty = (productId, qty) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setCart(prevCart => prevCart.map(item => 
      item.product.id === productId ? { ...item, quantity: qty } : item
    ));
  };

  const handleRemoveItem = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Form Submissions
  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setActiveView('checkout');
  };

  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    if (!shippingInfo.name || !shippingInfo.email || !shippingInfo.address || !shippingInfo.city || !shippingInfo.zip) {
      alert('Please fill out all shipping fields.');
      return;
    }
    setActiveView('payment');
  };

  const handlePaymentSuccess = (intentId) => {
    const orderNum = `SM-${Math.floor(100000 + Math.random() * 900000)}`;
    setCompletedOrder({
      orderNumber: orderNum,
      transactionId: intentId,
      shipping: shippingInfo,
      items: [...cart],
      total: cartTotal
    });
    setCart([]); // Clear cart
    setActiveView('confirmation');
  };

  // Pagination Calculations
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = productsList.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(productsList.length / productsPerPage);

  return (
    <div className="app-wrapper">
      <div className="app-container" style={{ paddingBottom: 0 }}>
        {/* Navigation */}
        <nav className="navbar animate-fade-in">
          <div className="nav-left">
            <button className="icon-btn mobile-menu-toggle" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="nav-links">
              <span className={`nav-link ${activeView === 'shop' ? 'active' : ''}`} onClick={() => setActiveView('shop')}>Shop</span>
              <span className={`nav-link ${activeView === 'benefits' ? 'active' : ''}`} onClick={() => setActiveView('benefits')}>Benefits</span>
              <span className={`nav-link ${activeView === 'admin' ? 'active' : ''}`} onClick={() => setActiveView('admin')}>Admin</span>
            </div>
          </div>
          
          <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setActiveView('shop')}>Sea Moss</div>
          
          <div className="nav-right">
            <div className="nav-links">
              <span className="nav-link" onClick={() => setActiveView('shop')}>Our Story</span>
            </div>
            <button className="icon-btn" onClick={() => setIsCartOpen(true)} style={{ position: 'relative' }}>
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span style={{
                  position: 'absolute', top: '-8px', right: '-8px',
                  background: 'var(--accent-gold)', color: 'var(--bg-darker)',
                  fontSize: '0.65rem', fontWeight: 800, width: '18px', height: '18px',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>{cart.reduce((sum, item) => sum + item.quantity, 0)}</span>
              )}
            </button>
            <button className="profile-btn">
              <span>Profile</span> <User size={18} />
            </button>
          </div>
        </nav>
      </div>

      {/* RENDER VIEWS */}

      {activeView === 'shop' && (
        <>
          {/* Brand Story Hero Banner */}
          <section 
            className="brand-story-hero animate-fade-in"
            onMouseEnter={() => setIsHeroHovered(true)}
            onMouseLeave={() => setIsHeroHovered(false)}
          >
            <div className="hero-inner">
              <div className="story-text-container">
                <span className="story-badge">Sustainably Wildcrafted</span>
                <h1 className="story-title">True Wellness Starts <span>From The Earth</span></h1>
                <p className="story-desc">
                  We are dedicated to providing the highest quality, wildcrafted sea moss, 
                  sustainably sourced from the pristine waters of the ocean. Our premium sea moss 
                  is packed with <strong>92 of the 102 essential minerals</strong> your body needs to thrive.
                </p>
                <p className="story-desc">
                  Whether you are looking to boost your immune system, improve digestion, support radiant skin, 
                  or naturally increase your energy levels, our carefully prepared sea moss gels are the perfect 
                  addition to your daily routine. We offer a variety of delicious, handcrafted blends—from 
                  our Original Gold to nutrient-rich Elderberry and Spirulina infusions.
                </p>
                
                <div className="story-stat-container" style={{ marginTop: '1.5rem' }}>
                  <div className="story-stat-card">
                    <div className="stat-number">92</div>
                    <div className="stat-label">Essential Minerals</div>
                  </div>
                  <div className="story-stat-card">
                    <div className="stat-number">100%</div>
                    <div className="stat-label">Wildcrafted</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="app-container" style={{ paddingTop: 0 }}>
            {/* Main Product Catalog */}
            <div className="catalog-header animate-fade-in">
              <h2 className="catalog-title">Explore Our <span>Handcrafted Blends</span></h2>
              <p style={{ color: 'var(--text-muted)' }}>Pure blends infused with natural fruits & herbs</p>
            </div>

            <main className="product-grid">
              {currentProducts.map((product, index) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  index={index} 
                  onOpenDetails={setSelectedProduct}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </main>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="pagination animate-fade-in">
                <button 
                  className="pagination-btn"
                  onClick={() => {
                    setCurrentPage(prev => Math.max(prev - 1, 1));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={16} /> Previous
                </button>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                    <button
                      key={pageNum}
                      className={`pagination-number ${currentPage === pageNum ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(pageNum);
                        window.scrollTo({ top: 400, behavior: 'smooth' });
                      }}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button 
                  className="pagination-btn"
                  onClick={() => {
                    setCurrentPage(prev => Math.min(prev + 1, totalPages));
                    window.scrollTo({ top: 400, behavior: 'smooth' });
                  }}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {activeView === 'benefits' && (
        <div className="app-container">
          <BenefitsView setView={setActiveView} />
        </div>
      )}

      {activeView === 'admin' && (
        <div className="app-container">
          <AdminPanel productsList={productsList} setProductsList={setProductsList} />
        </div>
      )}

      {activeView === 'checkout' && (
        <div className="app-container checkout-view">
          <button className="icon-btn" onClick={() => setActiveView('shop')} style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Continue Shopping
          </button>
          
          <div className="checkout-grid">
            {/* Shipping Address Inputs Form */}
            <form onSubmit={handleCheckoutSubmit} className="checkout-panel">
              <h2>Shipping <span>Details</span></h2>
              
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input 
                  type="text" id="name" required className="form-input" placeholder="John Doe"
                  value={shippingInfo.name} onChange={e => setShippingInfo({...shippingInfo, name: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input 
                  type="email" id="email" required className="form-input" placeholder="john@example.com"
                  value={shippingInfo.email} onChange={e => setShippingInfo({...shippingInfo, email: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="address">Delivery Address</label>
                <input 
                  type="text" id="address" required className="form-input" placeholder="123 Ocean Parkway"
                  value={shippingInfo.address} onChange={e => setShippingInfo({...shippingInfo, address: e.target.value})}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="city">City</label>
                  <input 
                    type="text" id="city" required className="form-input" placeholder="Miami"
                    value={shippingInfo.city} onChange={e => setShippingInfo({...shippingInfo, city: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="zip">ZIP / Postal Code</label>
                  <input 
                    type="text" id="zip" required className="form-input" placeholder="33101"
                    value={shippingInfo.zip} onChange={e => setShippingInfo({...shippingInfo, zip: e.target.value})}
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary cart-action-btn">
                Proceed to Payment
              </button>
            </form>

            {/* Order Review panel */}
            <div className="checkout-panel">
              <h2>Order <span>Summary</span></h2>
              <div className="summary-items-list">
                {cart.map(item => (
                  <div key={item.product.id} className="summary-item-row">
                    <div>
                      <span className="summary-item-name">{item.product.name}</span>
                      <span className="summary-item-qty">x {item.quantity}</span>
                    </div>
                    <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="cart-summary-box" style={{ borderTop: 'none', paddingTop: 0 }}>
                <div className="cart-summary-row">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="cart-summary-row">
                  <span>Shipping</span>
                  <span style={{ color: 'var(--primary-teal)' }}>FREE</span>
                </div>
                <div className="cart-summary-row total">
                  <span>Total Due</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'payment' && (
        <div className="app-container checkout-view">
          <button className="icon-btn" onClick={() => setActiveView('checkout')} style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
            <ArrowLeft size={18} /> Back to Shipping
          </button>

          <div className="checkout-grid">
            {/* Stripe Card Element form */}
            <Elements stripe={stripePromise}>
              <PaymentForm 
                cart={cart}
                total={cartTotal}
                shippingInfo={shippingInfo}
                onPaymentSuccess={handlePaymentSuccess}
                onBack={() => setActiveView('checkout')}
              />
            </Elements>

            {/* Total breakdown */}
            <div className="checkout-panel">
              <h2>Your <span>Order</span></h2>
              <div className="cart-summary-box" style={{ borderTop: 'none', paddingTop: 0 }}>
                <div className="cart-summary-row">
                  <span>Total Items</span>
                  <span>{cart.reduce((sum, i) => sum + i.quantity, 0)}</span>
                </div>
                <div className="cart-summary-row total" style={{ marginTop: '1.5rem' }}>
                  <span>Amount to Pay</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeView === 'confirmation' && completedOrder && (
        <div className="app-container success-view">
          <div className="success-card">
            <div className="success-checkmark-wrapper">
              <CheckCircle2 size={42} />
            </div>
            
            <h2 className="success-title">Order Confirmed</h2>
            <p className="success-subtitle">
              Thank you for shopping with us! Your premium organic sea moss blends are being prepared. 
              An order confirmation has been sent to <strong>{completedOrder.shipping.email}</strong>.
            </p>

            <div className="order-details-tile">
              <div className="order-tile-row">
                <span>Order Number</span>
                <span>{completedOrder.orderNumber}</span>
              </div>
              <div className="order-tile-row">
                <span>Transaction Ref</span>
                <span style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {completedOrder.transactionId}
                </span>
              </div>
              <div className="order-tile-row highlight">
                <span>Total Paid</span>
                <span>${completedOrder.total.toFixed(2)}</span>
              </div>
              <div className="order-tile-row">
                <span>Shipped To</span>
                <span>{completedOrder.shipping.name}</span>
              </div>
              <div className="order-tile-row">
                <span>Delivery Address</span>
                <span>{completedOrder.shipping.address}, {completedOrder.shipping.city} {completedOrder.shipping.zip}</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => setActiveView('shop')}
              style={{ width: '100%' }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* FOOTER & DIAGNOSTICS */}

      <div className="app-container" style={{ paddingTop: 0 }}>
        {/* Footer / Tech Stack */}
        <footer className="footer">
          <p>&copy; {new Date().getFullYear()} Sea Moss Store. Sourced sustainably, crafted organically.</p>
          <div className="tech-stack">
            <div className="tech-item"><Code size={18} /> Vanilla CSS React UI</div>
            <div className="tech-item"><Box size={18} /> Three.js & Fiber</div>
            <div className="tech-item"><Sparkles size={18} /> GSAP Animations</div>
            <div className="tech-item"><Database size={18} /> Firebase Firestore</div>
            <div className="tech-item"><Server size={18} /> Firebase Functions</div>
          </div>
        </footer>
      </div>

      {/* MODALS & OVERLAYS */}

      {/* Floating Gemini AI Assistant Button (Hidden for now) */}
      {/* 
      <button 
        className="ai-assistant-btn"
        onClick={() => alert('Placeholder: Google Gemini AI assistant would open here to recommend blends based on health goals.')}
      >
        <Bot size={20} />
        Ask Gemini
      </button>
      */}

      {/* Product Details Modal Overlay */}
      {selectedProduct && (
        <DetailsModal 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Shopping Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQty={handleUpdateQty}
        onRemove={handleRemoveItem}
        onProceedToCheckout={handleProceedToCheckout}
      />

      {/* Mobile Navigation Menu Drawer */}
      <MobileMenuDrawer 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        activeView={activeView}
        setActiveView={setActiveView}
      />
    </div>
  );
};

export default App;
