import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import useAuthStore from "../../store/useAuthStore";

const DEFAULT_LIST_ID = "default";
const BRAND_NAVY = "#0D1B3E";
const BRAND_BLUE = "#015DF0";
const BRAND_YELLOW = "#FEEE00";

let activeManagerExists = false;

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.productId || value.$oid || "";
};

const getUserId = (user) => String(user?._id || user?.id || "guest");

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
};

const createListId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `wishlist-${Date.now()}`;
};

const normalizeProduct = (product) => {
  const productId = getId(product);

  return {
    ...product,
    id: productId,
    _id: productId,
    title: product?.title || product?.name || "Product",
    name: product?.name || product?.title || "Product",
    image: product?.image || product?.images?.[0] || "/placeholder.png",
    images: product?.images?.length
      ? product.images
      : [product?.image].filter(Boolean),
    price: Number(product?.price || 0),
  };
};

const createDefaultList = (user) => ({
  id: DEFAULT_LIST_ID,
  name: user?.name || "My Wishlist",
  products: [],
  isLocked: true,
});

function WishlistToastManager() {
  const [enabled, setEnabled] = useState(false);
  const user = useAuthStore((state) => state.user);
  const userId = getUserId(user);
  const listsKey = `nexota:wishlist-lists:${userId}`;
  const settingsKey = `nexota:wishlist-settings:${userId}`;

  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [notice, setNotice] = useState("");

  const customLists = useMemo(
    () => lists.filter((list) => list.id !== DEFAULT_LIST_ID),
    [lists],
  );

  useEffect(() => {
    if (activeManagerExists) return undefined;

    activeManagerExists = true;
    setEnabled(true);

    return () => {
      activeManagerExists = false;
    };
  }, []);

  const loadLists = () => {
    const storedLists = readJson(listsKey, null);
    const nextLists = Array.isArray(storedLists)
      ? storedLists
      : [createDefaultList(user)];

    if (!Array.isArray(storedLists)) {
      localStorage.setItem(listsKey, JSON.stringify(nextLists));
      localStorage.setItem(
        settingsKey,
        JSON.stringify({
          defaultListId: DEFAULT_LIST_ID,
          publicLists: {},
        }),
      );
    }

    setLists(nextLists);

    const firstCustomList = nextLists.find(
      (list) => list.id !== DEFAULT_LIST_ID,
    );
    setSelectedListId(firstCustomList?.id || DEFAULT_LIST_ID);

    return nextLists;
  };

  useEffect(() => {
    if (!enabled) return;
    loadLists();
  }, [enabled, listsKey]);

  useEffect(() => {
    if (!enabled) return undefined;

    const handleWishlistAdded = (event) => {
      const product = normalizeProduct(event.detail?.product || {});
      const productId = getId(product);

      if (!productId) return;

      loadLists();
      setNotice("");
      setToast({
        product,
        listName: event.detail?.listName || "default list",
      });

      window.clearTimeout(window.__NEXOTA_WISHLIST_TOAST_TIMER__);
      window.__NEXOTA_WISHLIST_TOAST_TIMER__ = window.setTimeout(() => {
        setToast(null);
      }, 4200);
    };

    window.addEventListener("nexota:wishlist-added", handleWishlistAdded);

    return () => {
      window.removeEventListener("nexota:wishlist-added", handleWishlistAdded);
      window.clearTimeout(window.__NEXOTA_WISHLIST_TOAST_TIMER__);
    };
  }, [enabled, listsKey]);

  useEffect(() => {
    if (!modalOpen) return undefined;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  const saveLists = (nextLists) => {
    setLists(nextLists);
    localStorage.setItem(listsKey, JSON.stringify(nextLists));
    window.dispatchEvent(new CustomEvent("nexota:wishlist-lists-updated"));
  };

  const handleOpenEditor = () => {
    loadLists();
    setModalOpen(true);
    setNotice("");
    window.clearTimeout(window.__NEXOTA_WISHLIST_TOAST_TIMER__);
  };

  const handleCloseEditor = () => {
    setModalOpen(false);
    setNewListName("");
    setNotice("");
  };

  const handleCreateList = () => {
    const name = newListName.trim();
    if (!name) return;

    const newList = {
      id: createListId(),
      name,
      products: [],
      isLocked: true,
    };

    const nextLists = [...lists, newList];
    saveLists(nextLists);
    setSelectedListId(newList.id);
    setNewListName("");
  };

  const handleAddToSelectedList = () => {
    if (!toast?.product) return;

    if (selectedListId === DEFAULT_LIST_ID) {
      setNotice("Product already default list mein add ho chuka hai.");
      return;
    }

    const product = normalizeProduct(toast.product);
    const productId = getId(product);
    let alreadyExists = false;

    const nextLists = lists.map((list) => {
      if (list.id !== selectedListId) return list;

      const products = Array.isArray(list.products) ? list.products : [];
      alreadyExists = products.some((item) => getId(item) === productId);

      if (alreadyExists) return list;

      return {
        ...list,
        products: [product, ...products],
      };
    });

    saveLists(nextLists);
    setNotice(
      alreadyExists
        ? "Product is list mein already maujood hai."
        : "Product selected list mein add ho gaya.",
    );
  };

  if (!enabled) return null;

  return (
    <>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed inset-x-3 bottom-[5.4rem] z-[1001] mx-auto max-w-[420px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl shadow-slate-950/20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[420px] sm:p-4 md:bottom-6"
          >
            <div className="flex gap-3">
              <div
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
                style={{ backgroundColor: BRAND_YELLOW }}
              >
                <CheckCircle2 size={22} style={{ color: BRAND_NAVY }} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-black leading-snug text-slate-900 sm:text-[15px]">
                  Product has been added to the default list.
                </p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                  {toast.product.title || toast.product.name || "Product"}
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleOpenEditor}
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-sm font-black text-white"
                    style={{ backgroundColor: BRAND_BLUE }}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setToast(null)}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setToast(null)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Close wishlist toast"
              >
                <X size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1002] grid place-items-center overflow-y-auto bg-slate-900/50 px-3 py-5 backdrop-blur-sm"
            onMouseDown={handleCloseEditor}
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <h2 className="text-xl font-black text-slate-900">
                    Add to another wishlist
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
                    Product default list mein add ho chuka hai. Ab kisi aur list
                    mein bhi add kar sakte hain.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[70dvh] overflow-y-auto p-5">
                <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
                  {lists.map((list) => (
                    <label
                      key={list.id}
                      className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name="wishlist-list"
                        checked={selectedListId === list.id}
                        onChange={() => setSelectedListId(list.id)}
                        className="h-4 w-4"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-black text-slate-900">
                          {list.name}
                        </span>
                        <span className="block text-xs font-semibold text-slate-500">
                          {list.id === DEFAULT_LIST_ID
                            ? "Default list"
                            : `${list.products?.length || 0} items`}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>

                {customLists.length === 0 && (
                  <p className="mt-3 rounded-xl bg-yellow-50 px-4 py-3 text-xs font-bold leading-5 text-slate-700">
                    Abhi koi custom list nahi hai. Neeche new list create kar
                    sakte hain.
                  </p>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={newListName}
                    onChange={(event) => setNewListName(event.target.value)}
                    placeholder="Create new list"
                    className="h-11 min-w-0 flex-1 rounded-xl border border-slate-300 px-4 text-sm font-semibold outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleCreateList}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    <Plus size={16} />
                    Create
                  </button>
                </div>

                {notice && (
                  <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
                    {notice}
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={handleCloseEditor}
                  className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddToSelectedList}
                  className="h-11 rounded-xl px-5 text-sm font-black text-white"
                  style={{ backgroundColor: BRAND_BLUE }}
                >
                  Add to List
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default WishlistToastManager;
