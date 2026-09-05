"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Compass,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Trophy,
  ArrowUpRight,
  ChevronRight,
  Layers,
  X,
  Radio,
  Sliders,
  Dumbbell,
  Waves,
  Award,
  Clock,
  Calendar,
  Phone,
  ShieldCheck,
  Navigation,
  Plus,
  Info,
  Star,
  Activity,
  Zap,
} from "lucide-react";

export type FacilityCategory =
  | "ALL"
  | "gym"
  | "ground"
  | "stadium"
  | "pool"
  | "badminton"
  | "combat"
  | "science";

export interface SportsFacility {
  id: string;
  name: string;
  category: "gym" | "ground" | "stadium" | "pool" | "badminton" | "combat" | "science";
  categoryLabel: string;
  sport: string;
  region: "North" | "South" | "East" | "West" | "Central";
  distanceKm: number; // Must be realistically distributed, with full tracker range over 20 km
  rating: number;
  reviewsCount: number;
  operatingHours: string;
  isOpenNow: boolean;
  accessType: "Public" | "Pay & Play" | "Membership" | "SAI / Gov Subsidized";
  pricing: string;
  capacity: string;
  amenities: string[];
  keyHighlight: string;
  address: string;
  verified: boolean;
  verificationBadge: string;
  phone: string;
  x: number; // radar % from center (-100 to 100)
  y: number; // radar % from center (-100 to 100)
  colorCode: string;
}

export const GeospatialRadarView: React.FC = () => {
  // Category & Filter States
  const [selectedCategory, setSelectedCategory] = useState<FacilityCategory>("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Tracker Range (Comment requirement: tracker must be over 20 km)
  const [maxRadiusKm, setMaxRadiusKm] = useState<number>(100);
  const [selectedFacility, setSelectedFacility] = useState<SportsFacility | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [backendHubsCount, setBackendHubsCount] = useState<number | null>(null);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState<boolean>(false);
  const [bookingConfirmed, setBookingConfirmed] = useState<boolean>(false);
  const [bookingDate, setBookingDate] = useState<string>("Today, 7:00 PM - 8:30 PM");
  const [bookingSlotName, setBookingSlotName] = useState<string>("General Athletic Track Pass");
  const [isNavigationModalOpen, setIsNavigationModalOpen] = useState<boolean>(false);
  const [isAddFacilityModalOpen, setIsAddFacilityModalOpen] = useState<boolean>(false);

  // New Facility Form State
  const [newFacilityName, setNewFacilityName] = useState("");
  const [newFacilityCategory, setNewFacilityCategory] = useState<SportsFacility["category"]>("gym");
  const [newFacilitySport, setNewFacilitySport] = useState("Weightlifting & Conditioning");
  const [newFacilityRegion, setNewFacilityRegion] = useState<SportsFacility["region"]>("North");
  const [newFacilityDistance, setNewFacilityDistance] = useState(24);
  const [newFacilityAddress, setNewFacilityAddress] = useState("");
  const [newFacilityPricing, setNewFacilityPricing] = useState("Pay & Play: $5/session");

  // Comprehensive Database of Sports, Fitness & Athletic Facilities (14+ detailed entries)
  const [facilities, setFacilities] = useState<SportsFacility[]>([
    {
      id: "fac-1",
      name: "Apex High-Performance Olympic Gym",
      category: "gym",
      categoryLabel: "Gym & Strength Vault",
      sport: "Olympic Weightlifting & Powerlifting",
      region: "North",
      distanceKm: 22.4, // Over 20km
      rating: 4.9,
      reviewsCount: 420,
      operatingHours: "Open 24/7 (Access Keycard)",
      isOpenNow: true,
      accessType: "Membership",
      pricing: "$45/mo • Day Pass $12",
      capacity: "180 Athletes • 12 Olympic Platforms",
      amenities: [
        "Eleiko Calibrated Plates",
        "Chalk Stations",
        "Glute-Ham Developers",
        "Safety Squat Bars",
        "Sauna & Ice Bath",
      ],
      keyHighlight: "Official Training Ground for National Weightlifting Champions",
      address: "Plot 14, Sector 18, Northern Sports Enclave",
      verified: true,
      verificationBadge: "IWF Standard Certified",
      phone: "+91 (011) 4892-0192",
      x: 18,
      y: -28,
      colorCode: "#F59E0B", // Amber
    },
    {
      id: "fac-2",
      name: "Indraprastha Olympic Athletics Stadium",
      category: "stadium",
      categoryLabel: "National Athletic Stadium",
      sport: "Track & Field • Sprinting • Javelin",
      region: "Central",
      distanceKm: 28.5, // Over 20km
      rating: 4.9,
      reviewsCount: 1850,
      operatingHours: "05:30 AM - 10:00 PM",
      isOpenNow: true,
      accessType: "SAI / Gov Subsidized",
      pricing: "Free for Registered Athletes • $4 Public",
      capacity: "65,000 Seats • 8-Lane 400m Track",
      amenities: [
        "Mondo Synthetic Super X 720 Track",
        "Electronic Timing Laser Gates",
        "Pole Vault Pit",
        "Floodlit 4K Arena",
        "Medical Emergency Unit",
      ],
      keyHighlight: "World Athletics Grade-1 Certified Olympic Track",
      address: "Gate 4, Stadium Corridor, Central Capital Zone",
      verified: true,
      verificationBadge: "World Athletics Class 1",
      phone: "+91 (011) 2389-1000",
      x: -12,
      y: 15,
      colorCode: "#6366F1", // Indigo
    },
    {
      id: "fac-3",
      name: "BlueWave Olympic Aquatic Center",
      category: "pool",
      categoryLabel: "Olympic Swimming Complex",
      sport: "Swimming • Water Polo • Diving",
      region: "South",
      distanceKm: 34.2, // Over 20km
      rating: 4.8,
      reviewsCount: 680,
      operatingHours: "06:00 AM - 09:30 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$7 / 90-min Lap Session",
      capacity: "10 Lanes (50m Olympic) + 25m Warmup",
      amenities: [
        "50m Heated Olympic Pool",
        "Underwater Kinetic Stroke Cameras",
        "10m FINA Diving Platform",
        "Ozone Purified Water",
        "Hydrotherapy Whirlpool",
      ],
      keyHighlight: "FINA Approved Olympic Pool with Live Underwater Biomechanics",
      address: "Avenue 7, Marina Lake Drive, Southern Sector",
      verified: true,
      verificationBadge: "FINA Certified Facility",
      phone: "+91 (080) 4591-2234",
      x: 32,
      y: 42,
      colorCode: "#06B6D4", // Cyan
    },
    {
      id: "fac-4",
      name: "Apex Vanguard Football Turf & Athletic Ground",
      category: "ground",
      categoryLabel: "Athletic Ground & Turf",
      sport: "Football • Rugby • Conditioning Drills",
      region: "West",
      distanceKm: 41.8, // Over 20km
      rating: 4.7,
      reviewsCount: 520,
      operatingHours: "06:00 AM - 11:30 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$25/hr Team Turf Booking",
      capacity: "Full 11v11 Pitch • 400m Grass Perimeter",
      amenities: [
        "FIFA Quality Pro Synthetic Turf",
        "LED Match Floodlighting",
        "Speed Agility Ladder Zones",
        "Locker Rooms & Showers",
        "Spectator Stand for 800",
      ],
      keyHighlight: "Shock-absorbing rubber infill preventing joint injury during sprint decelerations",
      address: "Sports Hub Complex, Western Expressway Bypass",
      verified: true,
      verificationBadge: "FIFA Quality Certified",
      phone: "+91 (022) 2981-5501",
      x: -45,
      y: -22,
      colorCode: "#10B981", // Emerald
    },
    {
      id: "fac-5",
      name: "SmashZone International Badminton Academy",
      category: "badminton",
      categoryLabel: "Badminton Court Complex",
      sport: "Badminton • Racquet Sports",
      region: "East",
      distanceKm: 26.0, // Over 20km
      rating: 4.9,
      reviewsCount: 740,
      operatingHours: "05:00 AM - 11:00 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$9/hr Court Slot",
      capacity: "14 BWF-Approved Indoor Courts",
      amenities: [
        "BWF Grade 1 Teakwood + Mat Flooring",
        "High-Speed Shuttlecock Speed Radar",
        "Electronic Yonex Racquet Stringing",
        "Fully Air-Conditioned Arena",
        "High-Glare Anti-Shadow Lighting",
      ],
      keyHighlight: "Endorsed by National Badminton Olympians with Anti-Slip Flooring",
      address: "Eastern Ring Road, Sector 5 Tech City",
      verified: true,
      verificationBadge: "BWF Standard Arena",
      phone: "+91 (033) 4022-7711",
      x: 52,
      y: -15,
      colorCode: "#8B5CF6", // Violet
    },
    {
      id: "fac-6",
      name: "Spartan Combat Club & Boxing Dojo",
      category: "combat",
      categoryLabel: "Combat & Boxing Dojo",
      sport: "Boxing • MMA • Wrestling • Muay Thai",
      region: "North",
      distanceKm: 31.5, // Over 20km
      rating: 4.8,
      reviewsCount: 390,
      operatingHours: "06:00 AM - 10:30 PM",
      isOpenNow: true,
      accessType: "Membership",
      pricing: "$35/mo • Open Sparring $10",
      capacity: "Official 24ft Ring + 30ft Octagon Cage",
      amenities: [
        "Olympic Regulation Boxing Ring",
        "Full MMA Cage",
        "Heavy Bag Rack (24 Bags)",
        "Shock-Absorbing Wrestling Mats",
        "Speed Bags & Reflex Balls",
      ],
      keyHighlight: "High-cadence striking & grappling dojo equipped with impact sensors",
      address: "Industrial Area Phase 2, Ring Road North",
      verified: true,
      verificationBadge: "National Boxing Fed Accredited",
      phone: "+91 (011) 6781-9922",
      x: -25,
      y: -50,
      colorCode: "#F97316", // Orange
    },
    {
      id: "fac-7",
      name: "BioKinetics Sports Science & Cryo Lab",
      category: "science",
      categoryLabel: "Sports Science & Recovery",
      sport: "VO2 Max • Cryotherapy • Biomechanics",
      region: "Central",
      distanceKm: 23.8, // Over 20km
      rating: 5.0,
      reviewsCount: 290,
      operatingHours: "08:00 AM - 08:00 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "Cryo Session $25 • Full Metabolic Test $60",
      capacity: "6 Assessment Bays • 2 Cryo Chambers",
      amenities: [
        "Whole-Body -110°C Cryotherapy Chamber",
        "Cosmed K5 Portable VO2 Max Testing",
        "Bertec Force Plates & Jump Assessment",
        "Hyperbaric Oxygen Chamber",
        "Normatec Dynamic Compression Pods",
      ],
      keyHighlight: "State-of-the-art sports science institute for metabolic & jump kinetic analysis",
      address: "Health City Tower B, 4th Floor, Central",
      verified: true,
      verificationBadge: "SAI Sports Science Partner",
      phone: "+91 (011) 8821-3344",
      x: 10,
      y: 12,
      colorCode: "#F43F5E", // Rose
    },
    {
      id: "fac-8",
      name: "Thunderbolt CrossFit & Functional Strength Box",
      category: "gym",
      categoryLabel: "Functional Strength Box",
      sport: "CrossFit • Hyrox Conditioning",
      region: "South",
      distanceKm: 47.0, // Over 20km
      rating: 4.8,
      reviewsCount: 310,
      operatingHours: "05:30 AM - 09:30 PM",
      isOpenNow: true,
      accessType: "Membership",
      pricing: "$40/mo • Drop-in $10",
      capacity: "90 Athletes • 40m Turf Sled Track",
      amenities: [
        "Rogue Fitness Monster Rigs",
        "Concept2 Rowers, SkiErgs & Echo Bikes",
        "Sled Push Track",
        "Gymnastic Rings & Climbing Ropes",
        "Cold Plunge Tub",
      ],
      keyHighlight: "Hyrox and Functional Fitness certified training compound",
      address: "CrossFit Way, Silicon Enclave, South",
      verified: true,
      verificationBadge: "Affiliated CrossFit Box",
      phone: "+91 (080) 9912-3456",
      x: -30,
      y: 60,
      colorCode: "#F59E0B",
    },
    {
      id: "fac-9",
      name: "CyberDome Multi-Sport Indoor Arena",
      category: "stadium",
      categoryLabel: "Indoor Sports Arena",
      sport: "Basketball • Volleyball • Handball",
      region: "West",
      distanceKm: 54.5, // Over 20km
      rating: 4.9,
      reviewsCount: 920,
      operatingHours: "06:00 AM - 11:00 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$30/hr Full Court Slot",
      capacity: "8,500 Spectator Seating",
      amenities: [
        "Maple Hardwood Floating Floor",
        "Electronic 24s Shot Clocks",
        "Fiberglass Spring Backboards",
        "Locker Rooms with Recovery Tubs",
        "HD Live Streaming Cameras",
      ],
      keyHighlight: "NBA & FIBA Regulation hardwood courts with digital telemetry",
      address: "Outer Ring Expressway, West Zone",
      verified: true,
      verificationBadge: "FIBA Level 1 Certified",
      phone: "+91 (022) 7788-9900",
      x: -65,
      y: 20,
      colorCode: "#6366F1",
    },
    {
      id: "fac-10",
      name: "Aquastride Hydrotherapy & Diving Well",
      category: "pool",
      categoryLabel: "Hydrotherapy & Diving Center",
      sport: "Aquatic Rehab • Underwater Treadmill",
      region: "East",
      distanceKm: 62.1, // Over 20km
      rating: 4.7,
      reviewsCount: 215,
      operatingHours: "07:00 AM - 08:30 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$12/hr Hydro Session",
      capacity: "25m Deep Well + Heated Rehab Tank",
      amenities: [
        "Underwater Hydro-Treadmill",
        "Low-Gravity Water Resistance Jets",
        "Heated 34°C Thermal Recovery Pool",
        "Specialist Aquatic Physio Onsite",
        "Lifeguard & Emergency Response",
      ],
      keyHighlight: "Specialized zero-impact recovery facility for tendon and ligament rehab",
      address: "East Coast Wellness Park, East",
      verified: true,
      verificationBadge: "Sports Rehab Accredited",
      phone: "+91 (033) 5544-2211",
      x: 60,
      y: 45,
      colorCode: "#06B6D4",
    },
    {
      id: "fac-11",
      name: "GreenValley Multi-Sport Athletic Track & Ground",
      category: "ground",
      categoryLabel: "Athletic Ground & Track",
      sport: "Athletics • Cricket • Long Jump",
      region: "North",
      distanceKm: 78.4, // Over 20km
      rating: 4.6,
      reviewsCount: 410,
      operatingHours: "05:00 AM - 08:30 PM",
      isOpenNow: true,
      accessType: "Public",
      pricing: "Free Public Access • $15 Net Practice",
      capacity: "400m Running Track • 4 Cricket Nets",
      amenities: [
        "Cinder & Synthetic Sprint Tracks",
        "Dual Long Jump & Triple Jump Pits",
        "Turf Cricket Practice Pitches",
        "High Pole Floodlights",
        "Outdoor Bodyweight Calisthenics Rig",
      ],
      keyHighlight: "Open community training grounds hosting weekend regional track meets",
      address: "Green Valley Sports Reserve, North Highway",
      verified: true,
      verificationBadge: "Municipal Sports Facility",
      phone: "+91 (011) 2233-4455",
      x: 35,
      y: -68,
      colorCode: "#10B981",
    },
    {
      id: "fac-12",
      name: "Metro Smashers Badminton & Racquet Club",
      category: "badminton",
      categoryLabel: "Badminton Club",
      sport: "Badminton • Squash",
      region: "Central",
      distanceKm: 38.0, // Over 20km
      rating: 4.8,
      reviewsCount: 510,
      operatingHours: "06:00 AM - 11:00 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$8/hr Slot",
      capacity: "8 Courts • 2 Glass Squash Courts",
      amenities: [
        "High-Tension Synthetic Mats",
        "Robotic Shuttle Feeder Machines",
        "Pro Shop & Grip Replacement",
        "Locker Facilities",
        "Cafeteria & Protein Bar",
      ],
      keyHighlight: "Equipped with automated shuttlecock launcher for high-speed smash practice",
      address: "Metro City Complex, Central District",
      verified: true,
      verificationBadge: "State Badminton Association",
      phone: "+91 (011) 7711-2299",
      x: -20,
      y: 35,
      colorCode: "#8B5CF6",
    },
    {
      id: "fac-13",
      name: "IronForge Strongman & Calisthenics Compound",
      category: "gym",
      categoryLabel: "Strongman & Strength Compound",
      sport: "Strongman • Calisthenics • Grip Strength",
      region: "West",
      distanceKm: 85.0, // Over 20km
      rating: 4.9,
      reviewsCount: 190,
      operatingHours: "06:00 AM - 10:00 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: "$10 Day Pass • $35/mo",
      capacity: "Outdoor Strongman Yard + Indoor Gym",
      amenities: [
        "Atlas Stones (40kg to 160kg)",
        "Log Press Bars & Farmer Walk Handles",
        "Heavy Yoke Carriers",
        "Multi-Tier Calisthenics Rig",
        "Giant Tractor Tires & Sledgehammers",
      ],
      keyHighlight: "Premier outdoor strength compound for raw functional power & grip development",
      address: "West Coast Industrial Park, Sector 40",
      verified: true,
      verificationBadge: "Official Strongman Guild",
      phone: "+91 (022) 8899-1122",
      x: -75,
      y: -48,
      colorCode: "#F59E0B",
    },
    {
      id: "fac-14",
      name: "Elite Motion Capture & Biomechanics Institute",
      category: "science",
      categoryLabel: "Biomechanics & Recovery Institute",
      sport: "3D Motion Capture • Force Telemetry",
      region: "South",
      distanceKm: 92.5, // Over 20km
      rating: 5.0,
      reviewsCount: 160,
      operatingHours: "09:00 AM - 06:00 PM",
      isOpenNow: false,
      accessType: "Pay & Play",
      pricing: "$85 Biomechanical Movement Audit",
      capacity: "Full Motion Capture Optical Studio",
      amenities: [
        "16-Camera Qualisys Optical MoCap",
        "Wireless Delsys Surface EMG Sensors",
        "Dual In-Ground Force Plates",
        "Gait & Sprint Acceleration Profiling",
        "DEXA Body Composition Scan",
      ],
      keyHighlight: "High-resolution kinematic analysis pinpointing kinetic energy leaks in running and jumping",
      address: "Innovation Tech Corridor, South Gate",
      verified: true,
      verificationBadge: "ISO 9001 Sports Tech Certified",
      phone: "+91 (080) 3344-9988",
      x: 45,
      y: 70,
      colorCode: "#F43F5E",
    },
  ]);

  // Sync with backend geospatial plugin if live
  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/v1/plugins/geospatial/heatmap")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setBackendHubsCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

  // Filter Facilities by Category, Region, Search Query, and Max Radius
  const filteredFacilities = useMemo(() => {
    return facilities.filter((fac) => {
      if (selectedCategory !== "ALL" && fac.category !== selectedCategory) return false;
      if (selectedRegion !== "ALL" && fac.region !== selectedRegion) return false;
      if (fac.distanceKm > maxRadiusKm) return false;
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const matchName = fac.name.toLowerCase().includes(q);
        const matchSport = fac.sport.toLowerCase().includes(q);
        const matchCategory = fac.categoryLabel.toLowerCase().includes(q);
        const matchAmenity = fac.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchName && !matchSport && !matchCategory && !matchAmenity) return false;
      }
      return true;
    });
  }, [facilities, selectedCategory, selectedRegion, maxRadiusKm, searchQuery]);

  // Category Tabs Configuration
  const categoryTabs: { id: FacilityCategory; label: string; icon: React.ElementType; color: string }[] = [
    { id: "ALL", label: "All Facilities", icon: Compass, color: "text-cyan-400" },
    { id: "gym", label: "Gym & Strength", icon: Dumbbell, color: "text-amber-400" },
    { id: "ground", label: "Ground & Turf", icon: Trophy, color: "text-emerald-400" },
    { id: "stadium", label: "Stadium & Arena", icon: Award, color: "text-indigo-400" },
    { id: "pool", label: "Swimming Pool", icon: Waves, color: "text-cyan-400" },
    { id: "badminton", label: "Badminton Court", icon: Activity, color: "text-purple-400" },
    { id: "combat", label: "Combat Dojo", icon: Zap, color: "text-orange-400" },
    { id: "science", label: "Sports Science Lab", icon: Sparkles, color: "text-rose-400" },
  ];

  // Helper to handle community registration of a new sports venue
  const handleAddNewFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFacilityName.trim()) return;

    // Calculate arbitrary radar coordinates inside the radius
    const randomAngle = Math.random() * 2 * Math.PI;
    const normDist = (newFacilityDistance / maxRadiusKm) * 80;
    const xCoord = Math.round(Math.cos(randomAngle) * normDist);
    const yCoord = Math.round(Math.sin(randomAngle) * normDist);

    const categoryColors: Record<SportsFacility["category"], string> = {
      gym: "#F59E0B",
      ground: "#10B981",
      stadium: "#6366F1",
      pool: "#06B6D4",
      badminton: "#8B5CF6",
      combat: "#F97316",
      science: "#F43F5E",
    };

    const categoryTitles: Record<SportsFacility["category"], string> = {
      gym: "Gym & Strength Vault",
      ground: "Athletic Ground & Turf",
      stadium: "Stadium & Arena",
      pool: "Aquatic Center & Pool",
      badminton: "Badminton Court Complex",
      combat: "Combat & Boxing Dojo",
      science: "Sports Science & Lab",
    };

    const created: SportsFacility = {
      id: `fac-${Date.now()}`,
      name: newFacilityName,
      category: newFacilityCategory,
      categoryLabel: categoryTitles[newFacilityCategory],
      sport: newFacilitySport,
      region: newFacilityRegion,
      distanceKm: Number(newFacilityDistance),
      rating: 4.8,
      reviewsCount: 1,
      operatingHours: "06:00 AM - 10:00 PM",
      isOpenNow: true,
      accessType: "Pay & Play",
      pricing: newFacilityPricing || "Pay & Play: $5/session",
      capacity: "Public Sports Amenity",
      amenities: ["Verified Community Submission", "Training Area", "Equipment on Site"],
      keyHighlight: "Newly registered sports infrastructure node on PRANA Radar",
      address: newFacilityAddress || `${newFacilityRegion} Sector Sports Belt`,
      verified: true,
      verificationBadge: "Community Verified",
      phone: "+91 (011) 5000-0000",
      x: Math.max(-85, Math.min(85, xCoord)),
      y: Math.max(-85, Math.min(85, yCoord)),
      colorCode: categoryColors[newFacilityCategory],
    };

    setFacilities((prev) => [created, ...prev]);
    setSelectedFacility(created);
    setIsAddFacilityModalOpen(false);
    setNewFacilityName("");
    setNewFacilityAddress("");
  };

  const handleConfirmBooking = () => {
    setBookingConfirmed(true);
    setTimeout(() => {
      setBookingConfirmed(false);
      setIsBookingModalOpen(false);
    }, 2200);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="text-xs font-semibold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            Sports Infrastructure &bull; Geospatial Fitness Radar
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1 flex items-center gap-2">
            Sports &amp; Athletic Facilities Radar
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              {filteredFacilities.length} Venues Active
            </span>
            {backendHubsCount !== null && (
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Backend Live ({backendHubsCount} Hubs)
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time geospatial radar tracking gyms, stadiums, athletic grounds, Olympic swimming pools, badminton courts, combat dojos, and sports science centers.
          </p>
        </div>

        {/* Action Controls: Add New Facility & Quick Preset */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAddFacilityModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Register Sports Facility
          </button>
          <div className="px-3 py-1.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tracker Radius: <strong className="text-cyan-400">{maxRadiusKm} km</strong></span>
          </div>
        </div>
      </div>

      {/* Category Filter Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {categoryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-2 ${
                isActive
                  ? "bg-slate-800 text-white font-semibold border border-cyan-500/50 shadow-lg shadow-cyan-950/40"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
              <span>{tab.label}</span>
              {tab.id !== "ALL" && (
                <span className="text-[10px] font-mono opacity-60">
                  ({facilities.filter((f) => f.category === tab.id).length})
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search, Region & Over-20km Range Controller */}
      <div className="athena-card p-4 border-slate-800 bg-slate-950 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by facility name, sport (e.g. Olympic Track, Badminton, Cryo), or amenity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Region Selector */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-slate-400 font-mono text-[11px] mr-1">Region:</span>
            {["ALL", "North", "South", "East", "West", "Central"].map((region) => (
              <button
                key={region}
                onClick={() => setSelectedRegion(region)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  selectedRegion === region
                    ? "bg-cyan-600 text-white font-semibold shadow-sm"
                    : "bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Range Controller Configured Over 20 km */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Radar Tracking Range:</span>
            <strong className="text-cyan-300 text-sm">{maxRadiusKm} km</strong>
            <span className="text-[10px] text-slate-500">(Min: 20 km &bull; Max: 250 km)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Quick Presets */}
            <div className="hidden md:flex items-center gap-1 text-[11px]">
              {[25, 50, 100, 200].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setMaxRadiusKm(preset)}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    maxRadiusKm === preset
                      ? "bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {preset}km
                </button>
              ))}
            </div>

            {/* Slider */}
            <input
              type="range"
              min={20} // Enforce tracker is over 20 km
              max={250}
              step={5}
              value={maxRadiusKm}
              onChange={(e) => setMaxRadiusKm(parseInt(e.target.value))}
              className="w-44 sm:w-56 accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Main Radar Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Radar Sweep Canvas (7 Cols) */}
        <div className="lg:col-span-7 athena-card p-6 border-slate-800 bg-slate-950 flex flex-col items-center justify-center relative overflow-hidden min-h-[500px]">
          {/* Range Legend in Top Corner */}
          <div className="absolute top-4 left-4 z-20 flex flex-col gap-1 text-[10px] font-mono text-slate-400 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 backdrop-blur-sm">
            <div className="font-bold text-slate-200 mb-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              FACILITY LEGEND
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Gym &amp; Strength
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Ground &amp; Turf
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Stadium &amp; Arena
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Swimming Pool
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span> Badminton Court
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-400"></span> Sports Science Lab
            </div>
          </div>

          {/* Background Circular Radar Scope */}
          <div className="relative w-[340px] h-[340px] sm:w-[420px] sm:h-[420px] rounded-full border border-cyan-500/30 bg-[#050914] flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.12)]">
            {/* Concentric Range Rings with Distance Labels */}
            <div className="absolute w-[80%] h-[80%] rounded-full border border-cyan-500/20 flex items-start justify-center pt-0.5">
              <span className="text-[9px] font-mono text-cyan-400/50">{Math.round(maxRadiusKm * 0.8)}km</span>
            </div>
            <div className="absolute w-[55%] h-[55%] rounded-full border border-cyan-500/20 flex items-start justify-center pt-0.5">
              <span className="text-[9px] font-mono text-cyan-400/50">{Math.round(maxRadiusKm * 0.55)}km</span>
            </div>
            <div className="absolute w-[30%] h-[30%] rounded-full border border-cyan-500/20 flex items-start justify-center pt-0.5">
              <span className="text-[9px] font-mono text-cyan-400/50">{Math.round(maxRadiusKm * 0.3)}km</span>
            </div>

            {/* Radar Crosshairs */}
            <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
            <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>

            {/* Center Origin Node (User GPS Coordinate) */}
            <div className="w-4 h-4 rounded-full bg-cyan-500 animate-pulse ring-4 ring-cyan-500/30 z-10 flex items-center justify-center" title="You (Athletic Base Center)">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
            </div>

            {/* Rotating Radar Sweep Beam */}
            {isScanning && (
              <div
                className="absolute inset-0 rounded-full pointer-events-none origin-center"
                style={{
                  background:
                    "conic-gradient(from 0deg at 50% 50%, rgba(6, 182, 212, 0.35) 0deg, transparent 65deg, transparent 360deg)",
                  animation: "spin 4.5s linear infinite",
                }}
              ></div>
            )}

            {/* Plotted Interactive Facility Blips */}
            {filteredFacilities.map((fac) => {
              // Convert % position to pixels inside scope
              const leftPos = 50 + fac.x * 0.42;
              const topPos = 50 + fac.y * 0.42;
              const isSelected = selectedFacility?.id === fac.id;

              return (
                <div
                  key={fac.id}
                  onClick={() => setSelectedFacility(fac)}
                  style={{ left: `${leftPos}%`, top: `${topPos}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
                  title={`${fac.name} (${fac.distanceKm} km)`}
                >
                  <div className="relative">
                    {/* Glowing Radar Node */}
                    <span
                      style={{
                        backgroundColor: isSelected ? "#38BDF8" : fac.colorCode,
                        boxShadow: isSelected
                          ? "0 0 16px #38BDF8"
                          : `0 0 10px ${fac.colorCode}99`,
                      }}
                      className={`w-4 h-4 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? "scale-150 ring-4 ring-white"
                          : "ring-2 ring-black/60 hover:scale-125"
                      }`}
                    >
                      <span className="w-1.5 h-1.5 bg-black rounded-full"></span>
                    </span>

                    {/* Ping Wave Effect */}
                    <span
                      style={{ borderColor: fac.colorCode }}
                      className="absolute -inset-1 rounded-full border animate-ping opacity-40 pointer-events-none"
                    ></span>

                    {/* Floating Tooltip */}
                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 bg-slate-900/95 border border-slate-700 text-[11px] font-mono text-white rounded-lg whitespace-nowrap shadow-xl z-30 pointer-events-none">
                      <div className="font-bold flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: fac.colorCode }}
                        ></span>
                        {fac.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {fac.distanceKm} km away &bull; {fac.sport}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Cardinal Direction Compass Marks */}
            <span className="absolute top-2 font-mono text-[11px] text-cyan-400 font-bold">N</span>
            <span className="absolute bottom-2 font-mono text-[11px] text-cyan-400 font-bold">S</span>
            <span className="absolute left-2 font-mono text-[11px] text-cyan-400 font-bold">W</span>
            <span className="absolute right-2 font-mono text-[11px] text-cyan-400 font-bold">E</span>
          </div>

          {/* Radar Sweep Status Bar */}
          <div className="mt-5 flex items-center justify-between w-full text-[11px] font-mono text-slate-400 border-t border-slate-800/80 pt-3">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Continuous 360° Radar Sweep Active &bull; Range: &gt; 20 km
            </span>
            <button
              onClick={() => setIsScanning(!isScanning)}
              className="text-cyan-400 hover:text-cyan-300 underline font-semibold"
            >
              {isScanning ? "Pause Radar" : "Resume Radar"}
            </button>
          </div>
        </div>

        {/* Selected Facility Detailed Dossier (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedFacility ? (
            <div className="athena-card p-5 border-cyan-500/40 bg-slate-900/95 space-y-4 animate-in fade-in duration-300">
              {/* Facility Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3.5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase"
                      style={{
                        backgroundColor: `${selectedFacility.colorCode}25`,
                        color: selectedFacility.colorCode,
                        border: `1px solid ${selectedFacility.colorCode}50`,
                      }}
                    >
                      {selectedFacility.categoryLabel}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {selectedFacility.region} Zone
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white leading-tight flex items-center gap-1.5">
                    {selectedFacility.name}
                    {selectedFacility.verified && (
                      <span title="Verified Sports Facility">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      </span>
                    )}
                  </h3>

                  <div className="text-xs text-cyan-300 font-mono flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-cyan-400" />
                    {selectedFacility.sport}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedFacility(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Verified Badge & Accreditation */}
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{selectedFacility.verificationBadge}</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 font-bold font-mono">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{selectedFacility.rating}</span>
                  <span className="text-slate-500 font-normal">({selectedFacility.reviewsCount})</span>
                </div>
              </div>

              {/* Core Telemetry Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-cyan-400" /> Distance
                  </div>
                  <div className="text-sm font-bold text-white mt-1">
                    {selectedFacility.distanceKm} km away
                  </div>
                </div>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-emerald-400" /> Operating Status
                  </div>
                  <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    {selectedFacility.isOpenNow ? "Open Now" : "Closed"}
                  </div>
                </div>
              </div>

              {/* Hours & Access Details */}
              <div className="space-y-1.5 text-xs">
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-slate-400">Hours:</span>
                  <span className="text-slate-200 font-semibold">{selectedFacility.operatingHours}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-slate-400">Pricing / Access:</span>
                  <span className="text-emerald-300 font-semibold">{selectedFacility.pricing}</span>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                  <span className="text-slate-400">Capacity &amp; Spec:</span>
                  <span className="text-slate-200">{selectedFacility.capacity}</span>
                </div>
              </div>

              {/* Key Highlight */}
              <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 text-xs">
                <div className="text-[10px] font-bold text-cyan-400 uppercase font-mono flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3" /> Facility Highlight
                </div>
                <div className="text-slate-300 font-medium leading-relaxed">
                  {selectedFacility.keyHighlight}
                </div>
              </div>

              {/* Equipment & Amenities Tags */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold text-slate-400 uppercase font-mono">
                  Equipment &amp; Amenities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFacility.amenities.map((amenity, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300"
                    >
                      &bull; {amenity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Address */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{selectedFacility.address}</span>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="py-2.5 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Book Practice Slot
                </button>

                <button
                  onClick={() => setIsNavigationModalOpen(true)}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  Get Route &bull; {selectedFacility.distanceKm}km
                </button>
              </div>
            </div>
          ) : (
            /* Empty State Prompt */
            <div className="athena-card p-8 border-slate-800 bg-slate-900/40 text-center space-y-3 flex flex-col items-center justify-center min-h-[380px]">
              <div className="w-14 h-14 rounded-2xl bg-cyan-600/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/50">
                <Compass className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <div className="text-base font-bold text-white">Select Any Facility on Radar</div>
                <p className="text-xs text-slate-400 max-w-xs mt-1 leading-relaxed">
                  Click on any color-coded facility node to inspect operating hours, Olympic equipment, booking slots, and directions.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>Tracking facilities over 20 km to {maxRadiusKm} km</span>
              </div>
            </div>
          )}

          {/* Regional Sports Infrastructure Index */}
          <div className="athena-card p-4 space-y-2 border-slate-800 bg-slate-900/60 text-xs">
            <div className="text-[11px] font-bold text-white uppercase font-mono tracking-wider flex items-center justify-between">
              <span>National Athletic Infrastructure Index</span>
              <span className="text-cyan-400">{facilities.length} Verified Facilities</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-[11px]">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-500">Gyms &amp; Strength:</span>
                <strong className="text-amber-400">{facilities.filter((f) => f.category === "gym").length} Vaults</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-500">Grounds &amp; Turfs:</span>
                <strong className="text-emerald-400">{facilities.filter((f) => f.category === "ground").length} Arenas</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-500">Aquatic Pools:</span>
                <strong className="text-cyan-400">{facilities.filter((f) => f.category === "pool").length} Centers</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex justify-between">
                <span className="text-slate-500">Badminton Courts:</span>
                <strong className="text-purple-400">{facilities.filter((f) => f.category === "badminton").length} Academies</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Facility List Section */}
      <div className="athena-card p-6 border-slate-800 bg-slate-950 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              All Detected Sports Facilities ({filteredFacilities.length})
            </h3>
            <p className="text-xs text-slate-400">
              Showing venues within {maxRadiusKm} km range matching active category filters.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Average Distance:{" "}
            <strong className="text-white">
              {filteredFacilities.length > 0
                ? Math.round(
                    filteredFacilities.reduce((acc, f) => acc + f.distanceKm, 0) /
                      filteredFacilities.length
                  )
                : 0}{" "}
              km
            </strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredFacilities.map((fac) => (
            <div
              key={fac.id}
              onClick={() => setSelectedFacility(fac)}
              className={`p-4 rounded-xl border transition-all cursor-pointer bg-slate-900/60 hover:bg-slate-900 space-y-3 ${
                selectedFacility?.id === fac.id
                  ? "border-cyan-500 ring-2 ring-cyan-500/20"
                  : "border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
                    style={{
                      backgroundColor: `${fac.colorCode}20`,
                      color: fac.colorCode,
                    }}
                  >
                    {fac.categoryLabel}
                  </span>
                  <h4 className="text-sm font-bold text-white mt-1">{fac.name}</h4>
                  <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                    <Trophy className="w-3 h-3 text-cyan-400" />
                    {fac.sport}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-bold font-mono text-cyan-400">
                    {fac.distanceKm} km
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">{fac.region} Sector</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1 text-[10px] font-mono">
                {fac.amenities.slice(0, 3).map((a, i) => (
                  <span key={i} className="px-1.5 py-0.5 bg-slate-950 text-slate-400 rounded border border-slate-800">
                    {a}
                  </span>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-emerald-400 font-semibold">{fac.pricing}</span>
                <span className="text-cyan-400 hover:underline flex items-center gap-1">
                  Inspect <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal: Book Practice Slot */}
      {isBookingModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="athena-card w-full max-w-md p-6 border-cyan-500/40 bg-slate-900 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsBookingModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold">
                Instant Venue Reservation
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Book Practice Slot: {selectedFacility.name}
              </h3>
              <p className="text-xs text-slate-400">
                Reserve your verified lane, court, or strength platform.
              </p>
            </div>

            {bookingConfirmed ? (
              <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-base font-bold text-white">Reservation Confirmed!</div>
                  <p className="text-xs text-emerald-300 mt-1">
                    Pass Ref: #ATH-{Math.floor(100000 + Math.random() * 900000)}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Scheduled for: {bookingDate} &bull; Check-in via Digital Pass.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Select Practice Area / Slot:</label>
                  <select
                    value={bookingSlotName}
                    onChange={(e) => setBookingSlotName(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option>General Athletic Track Pass</option>
                    <option>Olympic Barbell Platform (90 mins)</option>
                    <option>Indoor Badminton Court (1 Hour)</option>
                    <option>50m Heated Lap Lane Reservation</option>
                    <option>Turf Sprint Drills Slot</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-mono block mb-1">Time Window:</label>
                  <select
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option>Today, 06:00 AM - 07:30 AM (Morning Sprint)</option>
                    <option>Today, 05:00 PM - 06:30 PM (Evening Peak)</option>
                    <option>Today, 07:00 PM - 08:30 PM (Night Lights)</option>
                    <option>Tomorrow, 06:30 AM - 08:00 AM (Early Training)</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between font-mono">
                  <span className="text-slate-400">Total Rate:</span>
                  <span className="text-emerald-400 font-bold">{selectedFacility.pricing}</span>
                </div>

                <button
                  onClick={handleConfirmBooking}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-4 h-4" />
                  Confirm &amp; Generate Digital Pass
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Get Route & Navigation */}
      {isNavigationModalOpen && selectedFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="athena-card w-full max-w-md p-6 border-cyan-500/40 bg-slate-900 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsNavigationModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5" /> Direct Geospatial Routing
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Route to {selectedFacility.name}
              </h3>
              <p className="text-xs text-slate-400">
                Turn-by-turn navigation across {selectedFacility.distanceKm} km sector distance.
              </p>
            </div>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Estimated Transit Time:</span>
                <strong className="text-cyan-300">
                  {Math.round(selectedFacility.distanceKm * 0.95)} mins (Express Highway)
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-2">
                <span className="text-slate-400">Traffic Density:</span>
                <span className="text-emerald-400 font-semibold">Low &bull; Clear Corridor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Facility Address:</span>
                <span className="text-white text-right font-medium max-w-[200px] truncate">
                  {selectedFacility.address}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300 font-mono">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">1</span>
                <span>Head toward {selectedFacility.region} Highway Link Corridor</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">2</span>
                <span>Continue on Outer Bypass for {Math.round(selectedFacility.distanceKm * 0.75)} km</span>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-600/20 text-cyan-400 flex items-center justify-center font-bold text-[10px]">3</span>
                <span>Take Exit 8 directly into {selectedFacility.name} Athlete Gate</span>
              </div>
            </div>

            <button
              onClick={() => alert(`Starting turn-by-turn navigation to ${selectedFacility.name} (${selectedFacility.distanceKm} km)...`)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Launch Live GPS Turn-by-Turn
            </button>
          </div>
        </div>
      )}

      {/* Modal: Register / Add New Sports Facility */}
      {isAddFacilityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="athena-card w-full max-w-lg p-6 border-cyan-500/40 bg-slate-900 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsAddFacilityModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Community Infrastructure Registration
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                Register Local Sports &amp; Fitness Facility
              </h3>
              <p className="text-xs text-slate-400">
                Add your local gym, turf, athletic ground, pool, or court to the live radar.
              </p>
            </div>

            <form onSubmit={handleAddNewFacility} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-mono block mb-1">Facility Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Metro Olympic Weightlifting Arena"
                  value={newFacilityName}
                  onChange={(e) => setNewFacilityName(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Category:</label>
                  <select
                    value={newFacilityCategory}
                    onChange={(e) => setNewFacilityCategory(e.target.value as SportsFacility["category"])}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="gym">Gym &amp; Strength Vault</option>
                    <option value="ground">Athletic Ground &amp; Turf</option>
                    <option value="stadium">Stadium &amp; Arena</option>
                    <option value="pool">Swimming Pool / Aquatic</option>
                    <option value="badminton">Badminton Court Complex</option>
                    <option value="combat">Combat &amp; Boxing Dojo</option>
                    <option value="science">Sports Science Lab</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-mono block mb-1">Region Sector:</label>
                  <select
                    value={newFacilityRegion}
                    onChange={(e) => setNewFacilityRegion(e.target.value as SportsFacility["region"])}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                    <option value="Central">Central</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-mono block mb-1">Primary Sport / Discipline:</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Track & Field, Swimming, Badminton"
                    value={newFacilitySport}
                    onChange={(e) => setNewFacilitySport(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-mono block mb-1">Distance (km, over 20km):</label>
                  <input
                    type="number"
                    min={21}
                    max={250}
                    value={newFacilityDistance}
                    onChange={(e) => setNewFacilityDistance(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Address / Landmark:</label>
                <input
                  type="text"
                  placeholder="e.g. Ring Road Sports Corridor, Gate 3"
                  value={newFacilityAddress}
                  onChange={(e) => setNewFacilityAddress(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-mono block mb-1">Pricing / Access Model:</label>
                <input
                  type="text"
                  placeholder="e.g. Pay & Play: $6/hr or Free Public"
                  value={newFacilityPricing}
                  onChange={(e) => setNewFacilityPricing(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add to Live Radar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
