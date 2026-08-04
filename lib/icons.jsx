"use client"

import { forwardRef } from "react"

import SolarAddCircle from "@solar-icons/react/ssr/ui/AddCircle"
import SolarAltArrowDown from "@solar-icons/react/ssr/arrows/AltArrowDown"
import SolarAltArrowLeft from "@solar-icons/react/ssr/arrows/AltArrowLeft"
import SolarAltArrowRight from "@solar-icons/react/ssr/arrows/AltArrowRight"
import SolarAltArrowUp from "@solar-icons/react/ssr/arrows/AltArrowUp"
import SolarArrowDown from "@solar-icons/react/ssr/arrows/ArrowDown"
import SolarArrowLeft from "@solar-icons/react/ssr/arrows/ArrowLeft"
import SolarArrowRight from "@solar-icons/react/ssr/arrows/ArrowRight"
import SolarArrowRightDown from "@solar-icons/react/ssr/arrows/ArrowRightDown"
import SolarArrowRightUp from "@solar-icons/react/ssr/arrows/ArrowRightUp"
import SolarArrowUp from "@solar-icons/react/ssr/arrows/ArrowUp"
import SolarBell from "@solar-icons/react/ssr/notifications/Bell"
import SolarBill from "@solar-icons/react/ssr/money/Bill"
import SolarBolt from "@solar-icons/react/ssr/ui/Bolt"
import SolarBuildings from "@solar-icons/react/ssr/building/Buildings"
import SolarBuildings2 from "@solar-icons/react/ssr/building/Buildings2"
import SolarCalculator from "@solar-icons/react/ssr/school/Calculator"
import SolarCalendar from "@solar-icons/react/ssr/time/Calendar"
import SolarCard from "@solar-icons/react/ssr/money/Card"
import SolarCase from "@solar-icons/react/ssr/school/Case"
import SolarChart from "@solar-icons/react/ssr/business/Chart"
import SolarChatRound from "@solar-icons/react/ssr/messages/ChatRound"
import SolarChatSquare from "@solar-icons/react/ssr/messages/ChatSquare"
import SolarCheckCircle from "@solar-icons/react/ssr/ui/CheckCircle"
import SolarClockCircle from "@solar-icons/react/ssr/time/ClockCircle"
import SolarCloseCircle from "@solar-icons/react/ssr/ui/CloseCircle"
import SolarCopy from "@solar-icons/react/ssr/ui/Copy"
import SolarDangerCircle from "@solar-icons/react/ssr/ui/DangerCircle"
import SolarDangerTriangle from "@solar-icons/react/ssr/ui/DangerTriangle"
import SolarDiskette from "@solar-icons/react/ssr/devices/Diskette"
import SolarDocumentText from "@solar-icons/react/ssr/notes/DocumentText"
import SolarDollar from "@solar-icons/react/ssr/money/Dollar"
import SolarDownload from "@solar-icons/react/ssr/arrows-action/Download"
import SolarEye from "@solar-icons/react/ssr/security/Eye"
import SolarFileCheck from "@solar-icons/react/ssr/files/FileCheck"
import SolarFileRemove from "@solar-icons/react/ssr/files/FileRemove"
import SolarFilter from "@solar-icons/react/ssr/ui/Filter"
import SolarFolder from "@solar-icons/react/ssr/folders/Folder"
import SolarGallery from "@solar-icons/react/ssr/video/Gallery"
import SolarGlobal from "@solar-icons/react/ssr/map/Global"
import SolarGraph from "@solar-icons/react/ssr/business/Graph"
import SolarGraphDown from "@solar-icons/react/ssr/business/GraphDown"
import SolarGraphUp from "@solar-icons/react/ssr/business/GraphUp"
import SolarHamburgerMenu from "@solar-icons/react/ssr/ui/HamburgerMenu"
import SolarInbox from "@solar-icons/react/ssr/messages/Inbox"
import SolarInfoCircle from "@solar-icons/react/ssr/ui/InfoCircle"
import SolarKey from "@solar-icons/react/ssr/security/Key"
import SolarLetter from "@solar-icons/react/ssr/messages/Letter"
import SolarLock from "@solar-icons/react/ssr/security/Lock"
import SolarLogout from "@solar-icons/react/ssr/arrows-action/Logout"
import SolarMagnifer from "@solar-icons/react/ssr/search/Magnifer"
import SolarMapPoint from "@solar-icons/react/ssr/map/MapPoint"
import SolarMenuDots from "@solar-icons/react/ssr/ui/MenuDots"
import SolarMicrophone from "@solar-icons/react/ssr/video/Microphone"
import SolarMoneyBag from "@solar-icons/react/ssr/money/MoneyBag"
import SolarMoon from "@solar-icons/react/ssr/weather/Moon"
import SolarMuted from "@solar-icons/react/ssr/video/Muted"
import SolarPalette from "@solar-icons/react/ssr/tools/Palette"
import SolarPen from "@solar-icons/react/ssr/messages/Pen"
import SolarPhone from "@solar-icons/react/ssr/call/Phone"
import SolarPieChart from "@solar-icons/react/ssr/business/PieChart"
import SolarPlain from "@solar-icons/react/ssr/messages/Plain"
import SolarPrinter from "@solar-icons/react/ssr/devices/Printer"
import SolarRecord from "@solar-icons/react/ssr/video/Record"
import SolarRefresh from "@solar-icons/react/ssr/arrows/Refresh"
import SolarRefreshCircle from "@solar-icons/react/ssr/arrows/RefreshCircle"
import SolarSale from "@solar-icons/react/ssr/money/Sale"
import SolarSettings from "@solar-icons/react/ssr/settings/Settings"
import SolarShield from "@solar-icons/react/ssr/security/Shield"
import SolarShieldCheck from "@solar-icons/react/ssr/security/ShieldCheck"
import SolarShieldCross from "@solar-icons/react/ssr/security/ShieldCross"
import SolarShieldWarning from "@solar-icons/react/ssr/security/ShieldWarning"
import SolarSquareArrowRightUp from "@solar-icons/react/ssr/arrows/SquareArrowRightUp"
import SolarSun from "@solar-icons/react/ssr/weather/Sun"
import SolarTag from "@solar-icons/react/ssr/money/Tag"
import SolarTarget from "@solar-icons/react/ssr/ui/Target"
import SolarTrashBinTrash from "@solar-icons/react/ssr/ui/TrashBinTrash"
import SolarUpload from "@solar-icons/react/ssr/arrows-action/Upload"
import SolarUser from "@solar-icons/react/ssr/users/User"
import SolarUserId from "@solar-icons/react/ssr/users/UserId"
import SolarUserPlus from "@solar-icons/react/ssr/users/UserPlus"
import SolarUsersGroupRounded from "@solar-icons/react/ssr/users/UsersGroupRounded"
import SolarVerifiedCheck from "@solar-icons/react/ssr/money/VerifiedCheck"
import SolarVideocamera from "@solar-icons/react/ssr/video/Videocamera"
import SolarWallet from "@solar-icons/react/ssr/money/Wallet"
import SolarWidget from "@solar-icons/react/ssr/settings/Widget"
import SolarWidget2 from "@solar-icons/react/ssr/settings/Widget2"

export const createIcon = (SolarComp, displayName) => {
  const Resolved = SolarComp?.default ?? SolarComp
  const Icon = forwardRef((props, ref) => {
    const next = { ...props }
    delete next.strokeWidth
    delete next.absoluteStrokeWidth
    const {
      size = "1em",
      color = "currentColor",
      weight = "Bold",
      ...rest
    } = next
    return (
      <Resolved
        ref={ref}
        size={size}
        color={color}
        weight={weight}
        {...rest}
      />
    )
  })
  Icon.displayName = displayName
  return Icon
}

/** @typedef {ReturnType<typeof createIcon>} LucideIcon */

export const Activity = createIcon(SolarGraph, 'Activity')
export const AlertCircle = createIcon(SolarDangerCircle, 'AlertCircle')
export const AlertTriangle = createIcon(SolarDangerTriangle, 'AlertTriangle')
export const ArrowDown = createIcon(SolarArrowDown, 'ArrowDown')
export const ArrowDownRight = createIcon(SolarArrowRightDown, 'ArrowDownRight')
export const ArrowLeft = createIcon(SolarArrowLeft, 'ArrowLeft')
export const ArrowRight = createIcon(SolarArrowRight, 'ArrowRight')
export const ArrowUp = createIcon(SolarArrowUp, 'ArrowUp')
export const ArrowUpRight = createIcon(SolarArrowRightUp, 'ArrowUpRight')
export const BadgeCheck = createIcon(SolarVerifiedCheck, 'BadgeCheck')
export const BarChart3 = createIcon(SolarChart, 'BarChart3')
export const Bell = createIcon(SolarBell, 'Bell')
export const Briefcase = createIcon(SolarCase, 'Briefcase')
export const Building = createIcon(SolarBuildings, 'Building')
export const Building2 = createIcon(SolarBuildings2, 'Building2')
export const Calculator = createIcon(SolarCalculator, 'Calculator')
export const Calendar = createIcon(SolarCalendar, 'Calendar')
export const Check = createIcon(SolarCheckCircle, 'Check')
export const CheckCircle = createIcon(SolarCheckCircle, 'CheckCircle')
export const CheckCircle2 = createIcon(SolarCheckCircle, 'CheckCircle2')
export const ChevronDown = createIcon(SolarAltArrowDown, 'ChevronDown')
export const ChevronLeft = createIcon(SolarAltArrowLeft, 'ChevronLeft')
export const ChevronRight = createIcon(SolarAltArrowRight, 'ChevronRight')
export const ChevronUp = createIcon(SolarAltArrowUp, 'ChevronUp')
export const Circle = createIcon(SolarRecord, 'Circle')
export const Clock = createIcon(SolarClockCircle, 'Clock')
export const Coins = createIcon(SolarMoneyBag, 'Coins')
export const Contact = createIcon(SolarUserId, 'Contact')
export const Copy = createIcon(SolarCopy, 'Copy')
export const CreditCard = createIcon(SolarCard, 'CreditCard')
export const DollarSign = createIcon(SolarDollar, 'DollarSign')
export const Download = createIcon(SolarDownload, 'Download')
export const Edit = createIcon(SolarPen, 'Edit')
export const ExternalLink = createIcon(SolarSquareArrowRightUp, 'ExternalLink')
export const Eye = createIcon(SolarEye, 'Eye')
export const FileCheck = createIcon(SolarFileCheck, 'FileCheck')
export const FileText = createIcon(SolarDocumentText, 'FileText')
export const FileX = createIcon(SolarFileRemove, 'FileX')
export const Filter = createIcon(SolarFilter, 'Filter')
export const Folder = createIcon(SolarFolder, 'Folder')
export const Globe = createIcon(SolarGlobal, 'Globe')
export const GripVertical = createIcon(SolarMenuDots, 'GripVertical')
export const Image = createIcon(SolarGallery, 'Image')
export const ImageIcon = createIcon(SolarGallery, 'ImageIcon')
export const Inbox = createIcon(SolarInbox, 'Inbox')
export const Info = createIcon(SolarInfoCircle, 'Info')
export const Key = createIcon(SolarKey, 'Key')
export const Layout = createIcon(SolarWidget, 'Layout')
export const LayoutDashboard = createIcon(SolarWidget2, 'LayoutDashboard')
export const Loader2 = createIcon(SolarRefreshCircle, 'Loader2')
export const Lock = createIcon(SolarLock, 'Lock')
export const LogOut = createIcon(SolarLogout, 'LogOut')
export const Mail = createIcon(SolarLetter, 'Mail')
export const MapPin = createIcon(SolarMapPoint, 'MapPin')
export const Menu = createIcon(SolarHamburgerMenu, 'Menu')
export const MessageCircle = createIcon(SolarChatRound, 'MessageCircle')
export const MessageSquare = createIcon(SolarChatSquare, 'MessageSquare')
export const Mic = createIcon(SolarMicrophone, 'Mic')
export const MicOff = createIcon(SolarMuted, 'MicOff')
export const Moon = createIcon(SolarMoon, 'Moon')
export const MoreVertical = createIcon(SolarMenuDots, 'MoreVertical')
export const Palette = createIcon(SolarPalette, 'Palette')
export const Percent = createIcon(SolarSale, 'Percent')
export const Phone = createIcon(SolarPhone, 'Phone')
export const PhoneOff = createIcon(SolarPhone, 'PhoneOff')
export const PieChart = createIcon(SolarPieChart, 'PieChart')
export const Plus = createIcon(SolarAddCircle, 'Plus')
export const Printer = createIcon(SolarPrinter, 'Printer')
export const Receipt = createIcon(SolarBill, 'Receipt')
export const RefreshCw = createIcon(SolarRefresh, 'RefreshCw')
export const Save = createIcon(SolarDiskette, 'Save')
export const Search = createIcon(SolarMagnifer, 'Search')
export const Send = createIcon(SolarPlain, 'Send')
export const Settings = createIcon(SolarSettings, 'Settings')
export const Shield = createIcon(SolarShield, 'Shield')
export const ShieldAlert = createIcon(SolarShieldWarning, 'ShieldAlert')
export const ShieldCheck = createIcon(SolarShieldCheck, 'ShieldCheck')
export const ShieldOff = createIcon(SolarShieldCross, 'ShieldOff')
export const Sun = createIcon(SolarSun, 'Sun')
export const Tag = createIcon(SolarTag, 'Tag')
export const Target = createIcon(SolarTarget, 'Target')
export const Trash2 = createIcon(SolarTrashBinTrash, 'Trash2')
export const TrendingDown = createIcon(SolarGraphDown, 'TrendingDown')
export const TrendingUp = createIcon(SolarGraphUp, 'TrendingUp')
export const Upload = createIcon(SolarUpload, 'Upload')
export const User = createIcon(SolarUser, 'User')
export const UserCog = createIcon(SolarUserId, 'UserCog')
export const UserPlus = createIcon(SolarUserPlus, 'UserPlus')
export const Users = createIcon(SolarUsersGroupRounded, 'Users')
export const Video = createIcon(SolarVideocamera, 'Video')
export const VideoOff = createIcon(SolarVideocamera, 'VideoOff')
export const Wallet = createIcon(SolarWallet, 'Wallet')
export const X = createIcon(SolarCloseCircle, 'X')
export const XCircle = createIcon(SolarCloseCircle, 'XCircle')
export const Zap = createIcon(SolarBolt, 'Zap')
