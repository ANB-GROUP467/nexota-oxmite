import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Lock,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Plus,
  Share2,
  ShoppingCart,
  Trash2,
  X,
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import useAuthStore from "../store/useAuthStore";
import useCartStore from "../store/useCartStore";
import useWishlistStore from "../store/useWishlistStore";

/* ─── Constants ─────────────────────────────────────────────────── */
const DEFAULT_LIST_ID = "default";
const EMPTY_ARRAY = [];
const BRAND_NAVY = "#0D1B3E";
const BRAND_BLUE = "#015DF0";
const BRAND_YELLOW = "#FEEE00";

/* ─── Helpers ───────────────────────────────────────────────────── */
const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.productId || "";
};

const getProductId = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (item.product && typeof item.product === "object")
    return getId(item.product);
  return item.product || item.productId || getId(item);
};

const getUserId = (user) => String(user?._id || user?.id || "guest");

const formatPrice = (value) =>
  `QAR ${Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
};

const createListId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `wishlist-${Date.now()}`;

const createInitialList = (user) => ({
  id: DEFAULT_LIST_ID,
  name: user?.name || "My Wishlist",
  products: [],
  isLocked: true,
});

/* ─── Font injection (Inter + DM Serif Display) ─────────────────── */
const FONT_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=DM+Serif+Display&display=swap');

  .wl-root,
  .wl-root * {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  .wl-display-heading {
    font-family: 'DM Serif Display', Georgia, serif;
    letter-spacing: -0.02em;
  }

  .wl-label-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .wl-list-btn {
    display: block;
    width: 100%;
    border-radius: 12px;
    border: 1px solid #E5E7EB;
    padding: 16px 18px;
    text-align: left;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s, box-shadow 0.15s;
  }
  .wl-list-btn:hover {
    border-color: #93B4F8;
    box-shadow: 0 2px 8px rgba(1,93,240,0.06);
  }
  .wl-list-btn.active {
    background: #F0F5FF;
    border-color: ${BRAND_BLUE};
    box-shadow: 0 2px 8px rgba(1,93,240,0.10);
  }

  .wl-card {
    overflow: hidden;
    border-radius: 16px;
    border: 1px solid #EAEAEC;
    background: #fff;
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .wl-card:hover {
    box-shadow: 0 8px 24px rgba(13,27,62,0.09);
    transform: translateY(-2px);
  }

  .wl-btn-primary {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 24px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 700;
    color: #fff;
    background: ${BRAND_BLUE};
    border: none;
    cursor: pointer;
    transition: opacity 0.15s;
    letter-spacing: 0.01em;
  }
  .wl-btn-primary:hover { opacity: 0.88; }
  .wl-btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }

  .wl-btn-ghost {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    height: 44px;
    padding: 0 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: #374151;
    background: #fff;
    border: 1px solid #D1D5DB;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
    letter-spacing: 0.01em;
  }
  .wl-btn-ghost:hover { background: #F9FAFB; border-color: #9CA3AF; }
  .wl-btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }

  .wl-badge-blue {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: #fff;
    background: ${BRAND_BLUE};
  }

  .wl-badge-gray {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 600;
    color: #6B7280;
    background: #F3F4F6;
    border: 1px solid #E5E7EB;
  }

  .wl-input {
    width: 100%;
    height: 48px;
    border-radius: 10px;
    border: 1.5px solid #D1D5DB;
    padding: 0 16px;
    font-size: 15px;
    font-weight: 500;
    font-family: 'Inter', sans-serif;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    color: #111827;
  }
  .wl-input:focus {
    border-color: ${BRAND_BLUE};
    box-shadow: 0 0 0 3px rgba(1,93,240,0.12);
  }
  .wl-input::placeholder { color: #9CA3AF; font-weight: 400; }

  .wl-price-tag {
    font-size: 17px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: ${BRAND_NAVY};
  }
  .wl-price-old {
    font-size: 12px;
    font-weight: 500;
    color: #9CA3AF;
    text-decoration: line-through;
  }

  .wl-menu-item {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 12px;
    padding: 14px 20px;
    font-size: 14px;
    font-weight: 600;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    color: #374151;
    transition: background 0.12s;
  }
  .wl-menu-item:hover { background: #F9FAFB; }
  .wl-menu-item.danger { color: #DC2626; }
  .wl-menu-item.danger:hover { background: #FEF2F2; }

  .wl-product-title {
    font-size: 14px;
    font-weight: 700;
    line-height: 1.45;
    color: #111827;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    min-height: 41px;
    text-decoration: none;
    transition: color 0.12s;
  }
  .wl-product-title:hover { color: ${BRAND_BLUE}; }

  .wl-empty-icon-wrap {
    width: 88px;
    height: 88px;
    border-radius: 22px;
    background: ${BRAND_YELLOW};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
  }

  .wl-section-heading {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #111827;
  }

  .wl-dismiss-btn {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 1px solid #E5E7EB;
    background: none;
    cursor: pointer;
    color: #6B7280;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .wl-dismiss-btn:hover { background: #F9FAFB; }

  .wl-trash-btn {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: 8px;
    border: 1px solid #FEE2E2;
    background: none;
    cursor: pointer;
    color: #DC2626;
    flex-shrink: 0;
    transition: background 0.12s;
  }
  .wl-trash-btn:hover { background: #FEF2F2; }

  .wl-toggle-track {
    position: relative;
    width: 44px;
    height: 24px;
    border-radius: 99px;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .wl-toggle-thumb {
    position: absolute;
    top: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: left 0.2s;
  }
`;

/* ─── Component ─────────────────────────────────────────────────── */
function Wishlist() {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);

  const backendWishlist = useWishlistStore(
    (s) => s.wishlist || s.items || EMPTY_ARRAY,
  );
  const fetchWishlist = useWishlistStore(
    (s) => s.fetchWishlist || s.getWishlist || s.fetchItems,
  );
  const removeWishlist = useWishlistStore(
    (s) => s.removeWishlist || s.removeFromWishlist || s.removeItem,
  );
  const clearWishlist = useWishlistStore((s) => s.clearWishlist);

  const cartItems = useCartStore(
    (s) => s.cart || s.cartItems || s.items || EMPTY_ARRAY,
  );
  const addToCart = useCartStore((s) => s.addToCart || s.addItem || s.addCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const increaseQuantity = useCartStore(
    (s) => s.increaseQuantity || s.incrementQuantity,
  );

  const userId = getUserId(user);
  const listsKey = `nexota:wishlist-lists:${userId}`;
  const settingsKey = `nexota:wishlist-settings:${userId}`;

  const [lists, setLists] = useState([]);
  const [settings, setSettings] = useState({
    defaultListId: DEFAULT_LIST_ID,
    publicLists: {},
  });
  const [selectedListId, setSelectedListId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingListId, setEditingListId] = useState("");
  const [listName, setListName] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (token && fetchWishlist) fetchWishlist();
  }, [token, fetchWishlist]);

  const loadWishlistLists = () => {
    const stored = readJson(listsKey, null);
    const nextLists = Array.isArray(stored)
      ? stored
      : [createInitialList(user)];
    const nextSettings = readJson(settingsKey, {
      defaultListId: nextLists[0]?.id || "",
      publicLists: {},
    });
    setLists(nextLists);
    setSettings(nextSettings);
    setSelectedListId(
      nextLists.some((l) => l.id === nextSettings.defaultListId)
        ? nextSettings.defaultListId
        : nextLists[0]?.id || "",
    );
    setMenuOpen(false);
  };

  useEffect(() => {
    loadWishlistLists();
    const handler = () => loadWishlistLists();
    window.addEventListener("nexota:wishlist-lists-updated", handler);
    return () =>
      window.removeEventListener("nexota:wishlist-lists-updated", handler);
  }, [listsKey, settingsKey, user]);

  const saveLists = (next) => {
    setLists(next);
    localStorage.setItem(listsKey, JSON.stringify(next));
  };
  const saveSettings = (next) => {
    setSettings(next);
    localStorage.setItem(settingsKey, JSON.stringify(next));
  };

  const hydratedLists = useMemo(
    () =>
      lists.map((list) => ({
        ...list,
        products:
          list.id === DEFAULT_LIST_ID
            ? backendWishlist
            : Array.isArray(list.products)
              ? list.products
              : [],
        isLocked: list.isLocked ?? true,
        isPublic: Boolean(settings.publicLists?.[list.id]),
        isDefault: settings.defaultListId === list.id,
      })),
    [backendWishlist, lists, settings],
  );

  const selectedList =
    hydratedLists.find((l) => l.id === selectedListId) ||
    hydratedLists[0] ||
    null;
  const selectedProducts = selectedList?.products || EMPTY_ARRAY;
  const totalItems = hydratedLists.reduce(
    (sum, l) => sum + Number(l.products?.length || 0),
    0,
  );

  const showNotice = (msg) => {
    setNotice(msg);
    window.setTimeout(() => setNotice(""), 2200);
  };

  const openCreateModal = () => {
    setEditingListId("");
    setListName("");
    setModalOpen(true);
  };
  const openEditModal = () => {
    if (!selectedList) return;
    setEditingListId(selectedList.id);
    setListName(selectedList.name);
    setModalOpen(true);
    setMenuOpen(false);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditingListId("");
    setListName("");
  };

  const handleSaveList = (e) => {
    e.preventDefault();
    const name = listName.trim();
    if (!name) return;

    if (editingListId) {
      saveLists(
        lists.map((l) => (l.id === editingListId ? { ...l, name } : l)),
      );
      closeModal();
      return;
    }

    const newList = { id: createListId(), name, products: [], isLocked: true };
    const nextLists = [...lists, newList];
    saveLists(nextLists);
    setSelectedListId(newList.id);
    if (!settings.defaultListId)
      saveSettings({ ...settings, defaultListId: newList.id });
    closeModal();
  };

  const handleDeleteList = async () => {
    if (!selectedList) return;
    if (selectedList.id === DEFAULT_LIST_ID && clearWishlist)
      await clearWishlist();
    const nextLists = lists.filter((l) => l.id !== selectedList.id);
    const nextPublicLists = { ...settings.publicLists };
    delete nextPublicLists[selectedList.id];
    const nextId = nextLists[0]?.id || "";
    saveLists(nextLists);
    saveSettings({
      ...settings,
      defaultListId:
        settings.defaultListId === selectedList.id
          ? nextId
          : settings.defaultListId,
      publicLists: nextPublicLists,
    });
    setSelectedListId(nextId);
    setMenuOpen(false);
  };

  const handleMakeDefault = () => {
    if (!selectedList) return;
    saveSettings({ ...settings, defaultListId: selectedList.id });
    setMenuOpen(false);
  };

  const handleTogglePublic = () => {
    if (!selectedList) return;
    saveSettings({
      ...settings,
      publicLists: {
        ...settings.publicLists,
        [selectedList.id]: !selectedList.isPublic,
      },
    });
  };

  const handleShare = async () => {
    if (!selectedList) return;
    if (!selectedList.isPublic) {
      showNotice("Enable public sharing first.");
      return;
    }
    const url = `${window.location.origin}${window.location.pathname}?wishlist=${selectedList.id}`;
    try {
      await navigator.clipboard.writeText(url);
      showNotice("Link copied to clipboard.");
    } catch {
      showNotice("Share link ready.");
    }
  };

  const handleRemoveProduct = async (product) => {
    if (!selectedList) return;
    const id = getProductId(product);
    if (!id) return;
    if (selectedList.id === DEFAULT_LIST_ID) {
      await removeWishlist?.(id);
      return;
    }
    saveLists(
      lists.map((l) =>
        l.id === selectedList.id
          ? {
              ...l,
              products: (l.products || []).filter(
                (p) => getProductId(p) !== id,
              ),
            }
          : l,
      ),
    );
  };

  const handleAddToCart = (product) => {
    const id = getProductId(product);
    if (!id) return;
    const existing = cartItems.find((i) => getProductId(i) === id);
    if (existing) {
      const qty = Number(existing.quantity || existing.qty || 1) + 1;
      if (updateQuantity) updateQuantity(id, qty);
      else if (increaseQuantity) increaseQuantity(id);
      else addToCart?.({ ...existing, quantity: qty }, 0);
      showNotice("Quantity updated in cart.");
      return;
    }
    addToCart?.(product, 1);
    showNotice("Added to cart.");
  };

  /* ─── Render ─── */
  return (
    <MainLayout>
      <style>{FONT_STYLE}</style>

      <div className="wl-root min-h-screen bg-white">
        <div style={{ maxWidth: 1440, margin: "0 auto", padding: "40px 24px" }}>
          {/* ── Header ── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 16,
              alignItems: "flex-end",
              justifyContent: "space-between",
              marginBottom: 32,
            }}
          >
            <div>
              <h1
                className="wl-display-heading"
                style={{
                  fontSize: 44,
                  color: "#0D1B3E",
                  margin: 0,
                  lineHeight: 1.1,
                }}
              >
                Wishlist
              </h1>
            </div>

            <button className="wl-btn-primary" onClick={openCreateModal}>
              <Plus size={17} />
              New list
            </button>
          </div>

          <div style={{ height: 1, background: "#EAEAEC", marginBottom: 32 }} />

          {/* ── Notice ── */}
          {notice && (
            <div
              style={{
                marginBottom: 20,
                padding: "12px 18px",
                borderRadius: 10,
                background: "#EFF6FF",
                border: "1px solid #BFDBFE",
                fontSize: 14,
                fontWeight: 600,
                color: "#1D4ED8",
              }}
            >
              {notice}
            </div>
          )}

          {/* ── Layout ── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(0,320px) 1fr",
              gap: "0 40px",
              alignItems: "start",
            }}
          >
            {/* ── Sidebar ── */}
            <aside
              style={{
                borderRight: "1px solid #EAEAEC",
                paddingRight: 32,
                paddingBottom: 32,
              }}
            >
              {/* User card */}
              <div
                style={{
                  padding: "18px 20px",
                  borderRadius: 14,
                  border: "1px solid #EAEAEC",
                  background: "#FAFAFA",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: BRAND_BLUE,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#fff",
                    marginBottom: 12,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {(user?.name || "?")[0].toUpperCase()}
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#111827",
                  }}
                >
                  {user?.name || "Customer"}
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#6B7280",
                  }}
                >
                  {totalItems} saved item{totalItems !== 1 ? "s" : ""}
                </p>
              </div>

              {/* List buttons */}
              {hydratedLists.length === 0 ? (
                <button
                  className="wl-list-btn"
                  onClick={openCreateModal}
                  style={{ borderStyle: "dashed" }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#374151",
                    }}
                  >
                    Create your first wishlist
                  </p>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: 13,
                      color: "#9CA3AF",
                    }}
                  >
                    No lists yet
                  </p>
                </button>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {hydratedLists.map((list) => (
                    <button
                      key={list.id}
                      className={`wl-list-btn${selectedList?.id === list.id ? " active" : ""}`}
                      onClick={() => {
                        setSelectedListId(list.id);
                        setMenuOpen(false);
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            flex: 1,
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#111827",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {list.name}
                        </span>
                        {list.isDefault && (
                          <CheckCircle2
                            size={16}
                            style={{ color: BRAND_BLUE, flexShrink: 0 }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 12,
                          fontWeight: 500,
                          color: "#9CA3AF",
                        }}
                      >
                        <span>
                          {list.products.length
                            ? `${list.products.length} item${list.products.length !== 1 ? "s" : ""}`
                            : "Empty"}
                        </span>
                        {list.isLocked && <Lock size={12} />}
                        {list.isPublic && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "#059669",
                              background: "#D1FAE5",
                              padding: "1px 7px",
                              borderRadius: 99,
                              letterSpacing: "0.04em",
                            }}
                          >
                            PUBLIC
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </aside>

            {/* ── Main ── */}
            <section style={{ minWidth: 0, paddingBottom: 40 }}>
              {/* Section header */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 16,
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  paddingBottom: 24,
                  borderBottom: "1px solid #EAEAEC",
                  marginBottom: 28,
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <h2 className="wl-section-heading" style={{ margin: 0 }}>
                      {selectedList?.name || "No list selected"}
                    </h2>
                    {selectedList?.isDefault && (
                      <span className="wl-badge-blue">Default</span>
                    )}
                    {selectedList && (
                      <span className="wl-badge-gray">
                        {selectedList.isPublic ? "Public" : "Private"}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#9CA3AF",
                    }}
                  >
                    {selectedProducts.length} saved product
                    {selectedProducts.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* Action row */}
                <div style={{ position: "relative", display: "flex", gap: 10 }}>
                  <button
                    className="wl-btn-ghost"
                    onClick={handleShare}
                    disabled={!selectedList}
                  >
                    <Share2 size={16} />
                    Share
                  </button>

                  <button
                    className="wl-btn-ghost"
                    onClick={() => setMenuOpen((v) => !v)}
                    disabled={!selectedList}
                  >
                    <MoreHorizontal size={18} />
                    More
                  </button>

                  {/* Dropdown menu */}
                  {menuOpen && selectedList && (
                    <div
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        zIndex: 40,
                        width: 280,
                        borderRadius: 14,
                        border: "1px solid #EAEAEC",
                        background: "#fff",
                        boxShadow: "0 12px 32px rgba(13,27,62,0.12)",
                        overflow: "hidden",
                      }}
                    >
                      <button className="wl-menu-item" onClick={openEditModal}>
                        <Pencil size={16} style={{ color: BRAND_BLUE }} />
                        Edit name
                      </button>

                      <div style={{ height: 1, background: "#F3F4F6" }} />

                      <button
                        className="wl-menu-item"
                        onClick={handleMakeDefault}
                      >
                        <CheckCircle2 size={16} style={{ color: "#6B7280" }} />
                        Set as default
                      </button>

                      <div style={{ height: 1, background: "#F3F4F6" }} />

                      <button
                        className="wl-menu-item"
                        onClick={handleTogglePublic}
                        style={{ justifyContent: "space-between" }}
                      >
                        <span>Public sharing</span>
                        <span
                          className="wl-toggle-track"
                          style={{
                            background: selectedList.isPublic
                              ? BRAND_BLUE
                              : "#D1D5DB",
                          }}
                        >
                          <span
                            className="wl-toggle-thumb"
                            style={{
                              left: selectedList.isPublic ? "24px" : "4px",
                            }}
                          />
                        </span>
                      </button>

                      <div style={{ height: 1, background: "#F3F4F6" }} />

                      <button
                        className="wl-menu-item danger"
                        onClick={handleDeleteList}
                      >
                        <Trash2 size={16} />
                        Delete list
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Empty states ── */}
              {!selectedList ? (
                <EmptyState
                  title="No list selected"
                  body="Create a wishlist to start saving products."
                  action={
                    <button
                      className="wl-btn-primary"
                      onClick={openCreateModal}
                    >
                      <Plus size={16} /> Create list
                    </button>
                  }
                />
              ) : selectedProducts.length === 0 ? (
                <EmptyState
                  title="This list is empty"
                  body="Browse products and save anything you love."
                  action={
                    <Link
                      className="wl-btn-primary"
                      to="/products"
                      style={{ textDecoration: "none" }}
                    >
                      <PackageOpen size={16} /> Browse products
                    </Link>
                  }
                />
              ) : (
                /* ── Product grid ── */
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(220px, 1fr))",
                    gap: 20,
                  }}
                >
                  {selectedProducts.map((product) => {
                    const productId = getProductId(product);
                    const image =
                      product.image ||
                      product.images?.[0] ||
                      "/placeholder.png";
                    const oldPrice = Number(product.oldPrice || 0);
                    const price = Number(product.price || 0);
                    const discount =
                      oldPrice > price
                        ? Math.round(((oldPrice - price) / oldPrice) * 100)
                        : 0;

                    return (
                      <article key={productId} className="wl-card">
                        <Link
                          to={`/product/${product.slug || productId}`}
                          style={{
                            display: "block",
                            background: "#F8F8FA",
                            position: "relative",
                            aspectRatio: "1",
                            overflow: "hidden",
                          }}
                        >
                          {discount > 0 && (
                            <span
                              style={{
                                position: "absolute",
                                top: 12,
                                left: 12,
                                zIndex: 1,
                                padding: "4px 10px",
                                borderRadius: 99,
                                background: "#EF4444",
                                fontSize: 11,
                                fontWeight: 800,
                                color: "#fff",
                                letterSpacing: "0.02em",
                              }}
                            >
                              -{discount}%
                            </span>
                          )}
                          <img
                            src={image}
                            alt={product.title || product.name || "Product"}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              display: "block",
                              transition: "transform 0.25s",
                            }}
                          />
                        </Link>

                        <div style={{ padding: "16px 16px 18px" }}>
                          <Link
                            to={`/product/${product.slug || productId}`}
                            className="wl-product-title"
                          >
                            {product.title || product.name || "Product"}
                          </Link>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-end",
                              justifyContent: "space-between",
                              gap: 8,
                              marginTop: 14,
                            }}
                          >
                            <div>
                              <p className="wl-price-tag">
                                {formatPrice(price)}
                              </p>
                              {oldPrice > price && (
                                <p className="wl-price-old">
                                  {formatPrice(oldPrice)}
                                </p>
                              )}
                            </div>

                            <button
                              className="wl-trash-btn"
                              onClick={() => handleRemoveProduct(product)}
                              aria-label="Remove from wishlist"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          <button
                            className="wl-btn-primary"
                            onClick={() => handleAddToCart(product)}
                            style={{ width: "100%", marginTop: 14 }}
                          >
                            <ShoppingCart size={16} />
                            Add to cart
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

        {/* ── Modal ── */}
        {modalOpen && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
              background: "rgba(13,27,62,0.40)",
              backdropFilter: "blur(2px)",
            }}
          >
            <form
              onSubmit={handleSaveList}
              style={{
                width: "100%",
                maxWidth: 440,
                borderRadius: 18,
                background: "#fff",
                padding: "28px 28px 24px",
                boxShadow: "0 24px 60px rgba(13,27,62,0.18)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                    color: "#111827",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {editingListId ? "Rename list" : "Create list"}
                </h2>
                <button
                  className="wl-dismiss-btn"
                  type="button"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>

              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#374151",
                  marginBottom: 8,
                  letterSpacing: "0.01em",
                }}
              >
                List name
              </label>
              <input
                className="wl-input"
                value={listName}
                onChange={(e) => setListName(e.target.value)}
                placeholder="e.g. Mobiles, Gift ideas…"
                autoFocus
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                  marginTop: 24,
                }}
              >
                <button
                  className="wl-btn-ghost"
                  type="button"
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button className="wl-btn-primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

/* ─── Illustrated empty state ───────────────────────────────────── */
function EmptyState({ title, body, action }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 460,
        textAlign: "center",
        padding: "40px 24px",
      }}
    >
      {/* Illustration */}
      <div
        style={{
          position: "relative",
          width: 220,
          height: 260,
          marginBottom: 32,
        }}
      >
        {/* Yellow glow blob */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 200,
            height: 200,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, #FEEE00 0%, rgba(254,238,0,0.18) 60%, transparent 80%)",
            zIndex: 0,
          }}
        />

        {/* Phone body */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%) rotate(-8deg)",
            width: 110,
            height: 192,
            borderRadius: 18,
            background: "#0D1B3E",
            zIndex: 1,
            boxShadow: "0 16px 40px rgba(13,27,62,0.28)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Phone notch */}
          <div
            style={{
              width: 40,
              height: 6,
              borderRadius: 99,
              background: "#1e3060",
              margin: "10px auto 0",
              flexShrink: 0,
            }}
          />
          {/* Phone screen */}
          <div
            style={{
              flex: 1,
              margin: "8px 6px 6px",
              borderRadius: 12,
              background: "#fff",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "10px 8px 0",
            }}
          >
            {/* Fake product image area */}
            <div
              style={{
                width: "100%",
                height: 68,
                borderRadius: 8,
                background: "#F3F4F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 6,
                position: "relative",
              }}
            >
              {/* Shirt silhouette */}
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path
                  d="M4 8L10 5L13 9H19L22 5L28 8L24 14H20V28H12V14H8L4 8Z"
                  fill="#D1D5DB"
                />
              </svg>
              {/* Heart badge */}
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  right: 5,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="#015DF0">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </div>
            </div>
            {/* Fake text lines */}
            <div
              style={{
                width: "80%",
                height: 5,
                borderRadius: 99,
                background: "#E5E7EB",
                marginBottom: 4,
              }}
            />
            <div
              style={{
                width: "60%",
                height: 5,
                borderRadius: 99,
                background: "#E5E7EB",
                marginBottom: 8,
              }}
            />
            {/* Fake button */}
            <div
              style={{
                width: "100%",
                height: 18,
                borderRadius: 6,
                background: BRAND_BLUE,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: "50%",
                  height: 4,
                  borderRadius: 99,
                  background: "rgba(255,255,255,0.6)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Floating heart badge (top right of phone) */}
        <div
          style={{
            position: "absolute",
            top: 20,
            right: 10,
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "#fff",
            boxShadow: "0 4px 16px rgba(1,93,240,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill={BRAND_BLUE}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </div>

        {/* Small star sparkle */}
        <div
          style={{
            position: "absolute",
            top: 50,
            left: 18,
            zIndex: 3,
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={BRAND_YELLOW}
            stroke="#D4A800"
            strokeWidth="1"
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 60,
            right: 18,
            zIndex: 3,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill={BRAND_YELLOW}
            stroke="#D4A800"
            strokeWidth="1"
          >
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
      </div>

      <h3
        style={{
          margin: "0 0 8px",
          fontSize: 22,
          fontWeight: 800,
          color: "#111827",
          letterSpacing: "-0.02em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          margin: "0 0 24px",
          fontSize: 14,
          fontWeight: 500,
          color: "#9CA3AF",
          maxWidth: 260,
          lineHeight: 1.6,
        }}
      >
        {body}
      </p>
      {action}
    </div>
  );
}

export default Wishlist;
