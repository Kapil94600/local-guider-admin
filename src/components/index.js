// src/components/index.js
// ═══════════════════════════════════════════════════════════════
// ✅ BARREL EXPORT — Import from '../components' anywhere
// ═══════════════════════════════════════════════════════════════

// NEW IMAGE INPUT COMPONENTS
export { default as ImageInput } from "./ImageInput";
export { default as MultiImageInput } from "./MultiImageInput";

// EXISTING COMPONENTS — Default exports
export { default as PanelHeader } from "./PanelHeader";
export { default as Loader } from "./Loader";
export { default as ErrorAlert } from "./ErrorAlert";
export { default as ErrorBoundary } from "./ErrorBoundary";
export { default as GalleryManager } from "./GalleryManager";
export { default as StatsCard } from "./StatsCard";
export { default as SkeletonLoader } from "./SkeletonLoader";
export { default as ExportButtons } from "./ExportButtons";
export { default as FilterBar } from "./FilterBar";
export { default as Header } from "./Header";
export { default as Sidebar } from "./Sidebar";
export { default as ProtectedRoute } from "./ProtectedRoute";
export { default as ScrollToTop } from "./ScrollToTop";
export { default as ToastNotification } from "./ToastNotification";
export { default as ToastProvider } from "./ToastProvider";

// EXISTING COMPONENTS — Named exports
export { EntityList } from "./EntityList";
export { StatusUpdateModal } from "./StatusUpdateModal";
export { DeleteConfirmModal } from "./DeleteConfirmModal";
export { LoadingSkeleton } from "./LoadingSkeleton";
export {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TablePagination,
  SearchInput,
} from "./TableComponents";