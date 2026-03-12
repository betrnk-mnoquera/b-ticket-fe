import {
  AlertCircle, ArrowLeft, BadgePercent, BarChart3, Bolt, BookOpen, Building2,
  Calendar, CalendarDays, Check, CheckCircle, ChevronLeft, ChevronRight, ChevronUp,
  ChevronDown, Circle, CirclePlus, CloudUpload, CreditCard, Car, Download, Eye,
  FileText, Gamepad2, Gift, GraduationCap, HeartPulse, ImagePlus, Info,
  LayoutDashboard, LayoutGrid, LayoutList, List, MapPin, Megaphone, Menu, Monitor,
  Package, PawPrint, Pencil, Phone, PlayCircle, Plus, Search, Settings, Shield,
  ShoppingBag, Sparkles, Star, Store, Tag, Tags, Ticket, ToggleLeft, Trash2,
  TreePine, TrendingUp, Truck, Type, User, Users, X, Percent, Wallet,
  MousePointerClick, Mail, Hash, Dumbbell, BookMarked, Clock, Flower2,
} from 'lucide-react'

const iconMap = {
  // Navigation & Actions
  arrow_back: ArrowLeft,
  add: Plus,
  add_circle: CirclePlus,
  close: X,
  check: Check,
  check_circle: CheckCircle,
  edit: Pencil,
  delete: Trash2,
  search: Search,
  visibility: Eye,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  info: Info,
  warning: AlertCircle,
  error: AlertCircle,

  // Layout & Dashboard
  dashboard: LayoutDashboard,
  grid_view: LayoutGrid,
  view_list: LayoutList,
  menu: Menu,

  // Business & Commerce
  store: Store,
  storefront: Store,
  corporate_fare: Building2,
  category: Tags,
  shopping_bag: ShoppingBag,
  payments: Wallet,
  credit_card: CreditCard,
  savings: BadgePercent,
  inventory_2: Package,

  // Marketing & Coupons
  confirmation_number: Ticket,
  local_offer: Tag,
  redeem: Gift,
  campaign: Megaphone,
  ads_click: MousePointerClick,
  play_circle: PlayCircle,
  percent: Percent,

  // Content & Media
  description: FileText,
  menu_book: BookOpen,
  photo_library: ImagePlus,
  add_photo_alternate: ImagePlus,
  cloud_upload: CloudUpload,
  download: Download,
  calendar_today: Calendar,
  calendar_month: CalendarDays,
  schedule: Clock,

  // People & Communication
  group: Users,
  person: User,
  email: Mail,
  phone: Phone,

  // Location & Navigation
  location_on: MapPin,
  tag: Hash,

  // Status & Indicators
  trending_up: TrendingUp,
  analytics: BarChart3,
  star: Star,

  // Categories (Line of Business)
  restaurant: BookMarked,
  devices: Monitor,
  health_and_safety: HeartPulse,
  yard: TreePine,
  directions_car: Car,
  sports_esports: Gamepad2,
  school: GraduationCap,
  pets: PawPrint,
  spa: Flower2,
  fitness_center: Dumbbell,
  local_library: BookOpen,

  // Roles & Admin
  admin_panel_settings: Settings,
  shield: Shield,

  // Coupons specific
  celebration: Sparkles,
  bolt: Bolt,
  local_shipping: Truck,
  card_giftcard: Gift,

  // Field types
  text_fields: Type,
  list: List,
  toggle_on: ToggleLeft,

  // Misc
  circle: Circle,
}

export default function Icon({ name, className = '', size = 18, style }) {
  const LucideIcon = iconMap[name]

  if (!LucideIcon) {
    return <Circle size={size} className={className} style={style} />
  }

  return <LucideIcon size={size} className={className} style={style} />
}
