import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle,
  ChevronRight,
  Edit3,
  ExternalLink,
  Home,
  Loader2,
  LocateFixed,
  MapPin,
  Plus,
  RefreshCw,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import useAuthStore from "../store/useAuthStore";

const BRAND_BLUE = "#015DF0";
const BRAND_NAVY = "#0D1B3E";
const BRAND_YELLOW = "#FEEE00";

const EMPTY_FORM = {
  label: "Home",
  fullName: "",
  email: "",
  phone: "",
  country: "",
  city: "",
  area: "",
  street: "",
  building: "",
  floor: "",
  apartment: "",
  zone: "",
  landmark: "",
  postalCode: "",
  deliveryInstructions: "",
  latitude: "",
  longitude: "",
  mapUrl: "",
  isDefault: false,
};

const parseJson = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const findToken = (value) => {
  if (!value || typeof value !== "object") return "";
  if (typeof value.token === "string") return value.token;
  if (typeof value.accessToken === "string") return value.accessToken;
  if (typeof value.jwt === "string") return value.jwt;
  return (
    findToken(value.state) || findToken(value.auth) || findToken(value.user)
  );
};

const getStoredToken = () => {
  const direct =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    localStorage.getItem("authToken");

  if (direct) return direct;

  for (let i = 0; i < localStorage.length; i += 1) {
    const token = findToken(
      parseJson(localStorage.getItem(localStorage.key(i))),
    );
    if (token) return token;
  }

  return "";
};

const getId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || value.id || value.$oid || "";
};

const readList = (data, keys) => {
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data)) return data;
  return [];
};

const normalizeAddress = (address = {}) => {
  const id = getId(address);

  return {
    ...EMPTY_FORM,
    ...address,
    id,
    _id: id,
    label: address.label || address.type || "Home",
    fullName: address.fullName || address.name || "",
    phone: address.phone || "",
    city: address.city || "",
    area: address.area || "",
    street: address.street || address.address || "",
    isDefault: Boolean(address.isDefault || address.default),
    latitude: address.latitude || "",
    longitude: address.longitude || "",
    mapUrl: address.mapUrl || createMapUrl(address.latitude, address.longitude),
  };
};

const createMapUrl = (latitude, longitude) => {
  if (!latitude || !longitude) return "";
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
};

const addressLine = (address) =>
  [
    address.street,
    address.building && `Building ${address.building}`,
    address.floor && `Floor ${address.floor}`,
    address.apartment && `Apt ${address.apartment}`,
    address.area,
    address.zone && `Zone ${address.zone}`,
    address.city,
    address.country,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

async function firstOk(paths, options) {
  for (const path of paths) {
    try {
      const { data } = await api.get(path, options);
      return data;
    } catch (error) {
      if (error.response?.status === 401) throw error;
    }
  }
  return null;
}

async function firstMutation(method, paths, payload, options) {
  for (const path of paths) {
    try {
      const { data } =
        method === "delete"
          ? await api.delete(path, options)
          : await api[method](path, payload, options);
      return data;
    } catch (error) {
      if (error.response?.status === 401) throw error;
    }
  }
  return null;
}

function Notice({ notice }) {
  if (!notice) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`mb-5 flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${
        notice.type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-blue-200 bg-blue-50 text-blue-700"
      }`}
    >
      {notice.type === "error" ? (
        <AlertCircle size={16} />
      ) : (
        <CheckCircle size={16} />
      )}
      {notice.message}
    </motion.div>
  );
}

function AddressCard({ address, onEdit, onDelete, onDefault, saving }) {
  const mapUrl =
    address.mapUrl || createMapUrl(address.latitude, address.longitude);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-black text-slate-950">
              {address.label || "Address"}
            </h2>
            {address.isDefault && (
              <span
                className="rounded-full px-2.5 py-1 text-xs font-black"
                style={{ backgroundColor: BRAND_YELLOW, color: BRAND_NAVY }}
              >
                Default
              </span>
            )}
          </div>
          <p className="mt-2 text-sm font-bold text-slate-800">
            {address.fullName || "Customer"}
          </p>
          {address.phone && (
            <p className="mt-1 text-sm font-medium text-slate-500">
              {address.phone}
            </p>
          )}
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-50">
          <MapPin size={20} className="text-[#015DF0]" />
        </div>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-slate-600">
        {addressLine(address) || "No address details added."}
      </p>

      {address.landmark && (
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Landmark: {address.landmark}
        </p>
      )}

      {address.deliveryInstructions && (
        <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-600">
          {address.deliveryInstructions}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {!address.isDefault && (
          <button
            type="button"
            onClick={() => onDefault(address)}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <Star size={15} />
            Set Default
          </button>
        )}
        <button
          type="button"
          onClick={() => onEdit(address)}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm font-black text-slate-700 hover:bg-slate-50"
        >
          <Edit3 size={15} />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(address)}
          disabled={saving}
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-red-100 px-3 text-sm font-black text-red-600 hover:bg-red-50 disabled:opacity-60"
        >
          <Trash2 size={15} />
          Delete
        </button>
        {mapUrl && (
          <a
            href={mapUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-50 px-3 text-sm font-black text-[#015DF0] hover:bg-blue-100"
          >
            <ExternalLink size={15} />
            Map
          </a>
        )}
      </div>
    </motion.article>
  );
}

function Field({ label, value, onChange, placeholder = "", required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <input
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold outline-none transition focus:border-[#015DF0] focus:ring-4 focus:ring-blue-50"
      />
    </label>
  );
}

function AddressModal({
  form,
  setForm,
  editing,
  saving,
  locating,
  onClose,
  onSubmit,
  onUseGps,
}) {
  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <motion.form
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        onSubmit={onSubmit}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">
              {editing ? "Update Address" : "Add Address"}
            </h2>
            <p className="text-sm font-medium text-slate-500">
              GPS se autofill karein ya manually address enter karein.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <button
            type="button"
            onClick={onUseGps}
            disabled={locating}
            className="mb-5 inline-flex h-12 items-center gap-2 rounded-xl px-5 text-sm font-black text-white disabled:opacity-60"
            style={{ backgroundColor: BRAND_BLUE }}
          >
            {locating ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LocateFixed size={17} />
            )}
            Use current GPS location
          </button>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label="Label"
              value={form.label}
              onChange={(v) => update("label", v)}
              placeholder="Home, Office"
            />
            <Field
              label="Full Name"
              value={form.fullName}
              onChange={(v) => update("fullName", v)}
              required
            />
            <Field
              label="Email"
              value={form.email}
              onChange={(v) => update("email", v)}
            />
            <Field
              label="Phone"
              value={form.phone}
              onChange={(v) => update("phone", v)}
              required
            />
            <Field
              label="Country"
              value={form.country}
              onChange={(v) => update("country", v)}
            />
            <Field
              label="City"
              value={form.city}
              onChange={(v) => update("city", v)}
              required
            />
            <Field
              label="Area"
              value={form.area}
              onChange={(v) => update("area", v)}
            />
            <Field
              label="Zone"
              value={form.zone}
              onChange={(v) => update("zone", v)}
            />
            <Field
              label="Street Address"
              value={form.street}
              onChange={(v) => update("street", v)}
              required
            />
            <Field
              label="Building"
              value={form.building}
              onChange={(v) => update("building", v)}
            />
            <Field
              label="Floor"
              value={form.floor}
              onChange={(v) => update("floor", v)}
            />
            <Field
              label="Apartment"
              value={form.apartment}
              onChange={(v) => update("apartment", v)}
            />
            <Field
              label="Landmark"
              value={form.landmark}
              onChange={(v) => update("landmark", v)}
            />
            <Field
              label="Postal Code"
              value={form.postalCode}
              onChange={(v) => update("postalCode", v)}
            />
            <Field
              label="Latitude"
              value={form.latitude}
              onChange={(v) => update("latitude", v)}
            />
            <Field
              label="Longitude"
              value={form.longitude}
              onChange={(v) => update("longitude", v)}
            />
            <label className="block md:col-span-2">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
                Delivery Instructions
              </span>
              <textarea
                value={form.deliveryInstructions || ""}
                onChange={(event) =>
                  update("deliveryInstructions", event.target.value)
                }
                rows={3}
                className="w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none transition focus:border-[#015DF0] focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>

          <label className="mt-5 flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={Boolean(form.isDefault)}
              onChange={(event) => update("isDefault", event.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm font-bold text-slate-700">
              Make this default address
            </span>
          </label>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#015DF0] px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Address
          </button>
        </div>
      </motion.form>
    </div>
  );
}

function Addresses() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const token = useAuthStore((state) => state.token || state.accessToken || "");

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [notice, setNotice] = useState(null);

  const authToken = token || getStoredToken();
  const authHeaders = useMemo(
    () =>
      authToken ? { headers: { Authorization: `Bearer ${authToken}` } } : {},
    [authToken],
  );

  const showNotice = (type, message) => {
    setNotice({ type, message });
    window.setTimeout(() => setNotice(null), 3200);
  };

  const fetchAddresses = async () => {
    if (!authToken) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const data = await firstOk(
        ["/auth/addresses", "/addresses", "/users/addresses", "/auth/me"],
        authHeaders,
      );
      const directList = readList(data, ["addresses", "data"]);
      const list =
        directList.length > 0 ? directList : data?.user?.addresses || [];
      setAddresses(list.map(normalizeAddress));
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
        return;
      }
      showNotice("error", "Addresses load nahi ho saken.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authToken]);

  const openCreate = () => {
    setEditingId("");
    setForm({
      ...EMPTY_FORM,
      fullName: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      isDefault: addresses.length === 0,
    });
    setModalOpen(true);
  };

  const openEdit = (address) => {
    setEditingId(address.id);
    setForm({ ...EMPTY_FORM, ...address });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId("");
    setForm(EMPTY_FORM);
  };

  const useGpsLocation = async () => {
    if (!navigator.geolocation) {
      showNotice("error", "Browser GPS support nahi kar raha.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = String(position.coords.latitude);
        const longitude = String(position.coords.longitude);
        const mapUrl = createMapUrl(latitude, longitude);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}`,
          );
          const data = await response.json();
          const address = data.address || {};

          setForm((prev) => ({
            ...prev,
            latitude,
            longitude,
            mapUrl,
            country: address.country || prev.country,
            city:
              address.city ||
              address.town ||
              address.village ||
              address.municipality ||
              prev.city,
            area:
              address.suburb ||
              address.neighbourhood ||
              address.quarter ||
              address.county ||
              prev.area,
            street:
              [address.road, address.house_number].filter(Boolean).join(" ") ||
              data.display_name ||
              prev.street,
            postalCode: address.postcode || prev.postalCode,
          }));
          showNotice("success", "Current location address mein add ho gayi.");
        } catch {
          setForm((prev) => ({ ...prev, latitude, longitude, mapUrl }));
          showNotice(
            "success",
            "GPS coordinates add ho gaye. Address manually complete kar dein.",
          );
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        showNotice("error", "Location permission deny ho gayi.");
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      mapUrl: form.mapUrl || createMapUrl(form.latitude, form.longitude),
    };

    try {
      const data = editingId
        ? await firstMutation(
            "put",
            [
              `/auth/addresses/${editingId}`,
              `/addresses/${editingId}`,
              `/users/addresses/${editingId}`,
            ],
            payload,
            authHeaders,
          )
        : await firstMutation(
            "post",
            ["/auth/addresses", "/addresses", "/users/addresses"],
            payload,
            authHeaders,
          );

      const directList = readList(data, ["addresses", "data"]);
      const list = directList.length > 0 ? directList : data?.user?.addresses;
      if (Array.isArray(list)) {
        setAddresses(list.map(normalizeAddress));
      } else {
        await fetchAddresses();
      }

      closeModal();
      showNotice("success", editingId ? "Address updated." : "Address added.");
    } catch (error) {
      showNotice(
        "error",
        error.response?.data?.message || "Address save nahi ho saka.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (address) => {
    setSaving(true);
    setAddresses((prev) =>
      prev.map((item) => ({ ...item, isDefault: item.id === address.id })),
    );

    try {
      await firstMutation(
        "patch",
        [
          `/auth/addresses/${address.id}/default`,
          `/addresses/${address.id}/default`,
        ],
        {},
        authHeaders,
      );
      showNotice("success", "Default address updated.");
    } catch {
      showNotice("error", "Default address update nahi ho saka.");
      fetchAddresses();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (address) => {
    const confirmed = window.confirm("Delete this address?");
    if (!confirmed) return;

    setSaving(true);
    const previous = addresses;
    setAddresses((prev) => prev.filter((item) => item.id !== address.id));

    try {
      await firstMutation(
        "delete",
        [
          `/auth/addresses/${address.id}`,
          `/addresses/${address.id}`,
          `/users/addresses/${address.id}`,
        ],
        undefined,
        authHeaders,
      );
      showNotice("success", "Address deleted.");
    } catch {
      setAddresses(previous);
      showNotice("error", "Address delete nahi ho saka.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#f6f7fb]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-bold text-slate-500">
            <Link to="/" className="hover:text-[#015DF0]">
              Home
            </Link>
            <ChevronRight size={12} />
            <Link to="/account" className="hover:text-[#015DF0]">
              My Account
            </Link>
            <ChevronRight size={12} />
            <span className="text-slate-900">Addresses</span>
          </div>

          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-[#015DF0]">
                Delivery
              </p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-slate-950">
                Saved Addresses
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                GPS se current location add karein, ya manually complete address
                save karein.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={fetchAddresses}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
              >
                <RefreshCw size={16} />
                Refresh
              </button>
              <button
                type="button"
                onClick={openCreate}
                className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-black text-white"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Plus size={16} />
                Add Address
              </button>
            </div>
          </div>

          <AnimatePresence>
            <Notice notice={notice} />
          </AnimatePresence>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <Loader2
                size={38}
                className="mx-auto animate-spin text-[#015DF0]"
              />
              <p className="mt-4 text-sm font-bold text-slate-500">
                Loading addresses...
              </p>
            </div>
          ) : addresses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
              <div
                className="mx-auto grid h-20 w-20 place-items-center rounded-2xl"
                style={{ backgroundColor: BRAND_YELLOW }}
              >
                <Home size={34} style={{ color: BRAND_NAVY }} />
              </div>
              <h2 className="mt-5 text-2xl font-black text-slate-950">
                No address saved
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm font-medium text-slate-500">
                Checkout fast karne ke liye apna delivery address save karein.
              </p>
              <button
                type="button"
                onClick={openCreate}
                className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-black text-white"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <Plus size={16} />
                Add Address
              </button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {addresses.map((address) => (
                <AddressCard
                  key={address.id}
                  address={address}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onDefault={handleSetDefault}
                  saving={saving}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <AddressModal
            form={form}
            setForm={setForm}
            editing={Boolean(editingId)}
            saving={saving}
            locating={locating}
            onClose={closeModal}
            onSubmit={handleSubmit}
            onUseGps={useGpsLocation}
          />
        )}
      </AnimatePresence>
    </MainLayout>
  );
}

export default Addresses;
