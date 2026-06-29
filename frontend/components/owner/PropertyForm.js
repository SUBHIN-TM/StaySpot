"use client";

// Shared form for creating AND editing a property.
// Pass `existing` = a property object to edit, or null to create.
//
// Upload flow (direct-to-storage):
//   • The moment a photo/video is PICKED, the browser uploads it STRAIGHT to
//     object storage via a presigned URL (the backend never buffers the bytes).
//     We keep the returned storage `key`.
//   • On SUBMIT we create/update the property, then send just the keys.
//   • If a picked file is removed — or the form is cancelled — we tell the
//     backend to delete the now-orphaned object. Anything we miss (tab closed,
//     crash) is cleaned up by the server's pending-upload sweep.

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, apiPatch, apiDelete, uploadToPresignedUrl } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";
import { STATE_LIST, DEFAULT_STATE, districtsOf } from "@/lib/geo";
import { AMENITIES, FURNISHING, PETS, ELECTRICITY, PREFERRED_TENANT, FOOD } from "@/lib/listingMeta";

// Fallback caps used only until the server's limits load (server re-validates anyway).
const FALLBACK_LIMITS = {
  image: { maxMb: 8, maxBytes: 8 * 1024 * 1024 },
  video: { maxMb: 50, maxBytes: 50 * 1024 * 1024 },
};

// Attachment-state messages — kept as constants so we can auto-clear them once
// the underlying condition (still uploading / has a failed file) goes away.
const UPLOADING_MSG = "Please wait for attachments to finish uploading.";
const FAILED_MSG = "Some attachments failed to upload — remove and re-add them.";

// Capitalize the first letter of each word (mirrors the backend's normaliser).
const capitalizeWords = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const TYPES = ["room", "apartment", "house", "villa", "pg", "hostel", "shared"];
const STATUSES = [
  { value: "available", label: "Available" },
  { value: "partially_occupied", label: "Partially occupied" },
  { value: "occupied", label: "Occupied" },
];

let pickSeq = 0; // local id generator for picked items

export default function PropertyForm({ existing }) {
  const router = useRouter();
  const isEdit = !!existing;
  const token = getUserToken();

  // Text fields (prefilled when editing).
  const [form, setForm] = useState({
    title: existing?.title || "",
    description: existing?.description || "",
    property_type: existing?.property_type || "room",
    rent_amount: existing?.rent_amount ?? "",
    max_persons: existing?.max_persons ?? "",
    occupancy_status: existing?.occupancy_status || "available",
    state: existing?.state || DEFAULT_STATE,
    district: existing?.district || "",
    pincode: existing?.pincode || "",
    city: existing?.city || "", // Town / Locality (free text)
    landmark: existing?.landmark || "",
    address: existing?.address || "",
    map_link: existing?.map_link || "",
    // Amenities + policies (all optional). amenities is a multi-select array.
    amenities: existing?.amenities || [],
    furnishing: existing?.furnishing || "",
    pets_allowed: existing?.pets_allowed || "",
    electricity_billing: existing?.electricity_billing || "",
    preferred_tenant: existing?.preferred_tenant || "",
    food_included: existing?.food_included || "",
  });

  // Toggle an amenity in/out of the multi-select list.
  function toggleAmenity(value) {
    setForm((f) => {
      const has = (f.amenities || []).includes(value);
      const amenities = has
        ? f.amenities.filter((a) => a !== value)
        : [...(f.amenities || []), value];
      return { ...f, amenities };
    });
  }

  // Pincode → district autofill state.
  const [pinLoading, setPinLoading] = useState(false);
  const [pinNote, setPinNote] = useState("");

  // Locality dropdown: options come from our DB (per district) merged with the
  // pincode's post-office areas. "Other" lets the owner add a new one.
  const [dbLocalities, setDbLocalities] = useState([]);
  const [pinAreas, setPinAreas] = useState([]);
  const [localityOther, setLocalityOther] = useState(false);

  // Combined, de-duplicated, sorted list shown in the dropdown.
  const localityOptions = Array.from(new Set([...dbLocalities, ...pinAreas])).sort((a, b) =>
    a.localeCompare(b)
  );
  const pincodeReady = /^\d{6}$/.test(form.pincode || ""); // district waits for a valid pincode
  const locationLocked = !form.district; // town/landmark/address wait for a district

  // Load this PINCODE's known localities whenever the pincode changes, so a
  // locality only shows up for the pincode it belongs to.
  useEffect(() => {
    let active = true;
    if (!/^\d{6}$/.test(form.pincode || "")) {
      setDbLocalities([]);
      return;
    }
    apiGet(`/geo/localities?pincode=${form.pincode}`, token)
      .then((d) => active && setDbLocalities(d.localities || []))
      .catch(() => active && setDbLocalities([]));
    return () => {
      active = false;
    };
  }, [form.pincode]);

  // If the current locality isn't a known option (e.g. editing an old listing,
  // or a freshly-typed one), show it in the "Other" text box.
  useEffect(() => {
    if (form.city && !localityOptions.includes(form.city)) setLocalityOther(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbLocalities, pinAreas]);

  // Locality dropdown change: pick a known one, or switch to free-text "Other".
  function onLocalitySelect(value) {
    if (value === "__other__") {
      setLocalityOther(true);
      set("city", "");
    } else {
      setLocalityOther(false);
      set("city", value);
    }
  }

  // When the owner finishes typing an "Other" locality, normalise it (trim +
  // collapse spaces) and, if it matches an existing option case-insensitively,
  // snap to that one — so we don't create a duplicate of "Kakkanad"/"kakkanad".
  function normalizeLocalityInput() {
    const v = capitalizeWords((form.city || "").trim().replace(/\s+/g, " "));
    if (!v) return set("city", "");
    const match = localityOptions.find((o) => o.toLowerCase() === v.toLowerCase());
    if (match) {
      setLocalityOther(false);
      set("city", match);
    } else {
      set("city", v);
    }
  }

  // Newly picked images: [{ id, preview, status: 'uploading'|'done'|'error', key }]
  const [images, setImages] = useState([]);
  // Newly picked video: { name, status: 'uploading'|'done'|'error', key } | null
  const [video, setVideo] = useState(null);
  const [existingImages, setExistingImages] = useState(existing?.images || []);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showErrors, setShowErrors] = useState(false); // highlight required fields after a submit attempt

  // Per-field validity (only flagged after a submit attempt).
  const titleErr = showErrors && !form.title.trim();
  const pinErr = showErrors && !pincodeReady;
  const distErr = showErrors && pincodeReady && !form.district;

  // Live attachment state.
  const anyUploading = images.some((i) => i.status === "uploading") || video?.status === "uploading";
  const anyFailed = images.some((i) => i.status === "error") || video?.status === "error";

  // Auto-clear the attachment messages once their condition resolves, so a stale
  // "Please wait…" doesn't linger above the button after the upload finishes.
  useEffect(() => {
    if (error === UPLOADING_MSG && !anyUploading) setError("");
    if (error === FAILED_MSG && !anyFailed) setError("");
  }, [error, anyUploading, anyFailed]);

  // Admin-configured max upload sizes; fetched on mount.
  const [limits, setLimits] = useState(FALLBACK_LIMITS);
  useEffect(() => {
    apiGet("/uploads/limits", token)
      .then((d) => d?.limits && setLimits(d.limits))
      .catch(() => {}); // fall back to defaults; the server still enforces real limits
  }, []);

  // Refs mirror state so cleanup / cancel handlers see the latest values.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const videoRef = useRef(video);
  videoRef.current = video;

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Pincode entry: keep only digits, and once 6 are entered, ask the backend to
  // look it up (free India Post API) and auto-fill state + district + locality
  // suggestions. Falls back to manual selection if the lookup can't resolve it.
  async function onPincodeChange(value) {
    const pin = value.replace(/\D/g, "").slice(0, 6);
    set("pincode", pin);
    setPinNote("");
    if (pin.length !== 6) return;

    setPinLoading(true);
    try {
      const d = await apiGet(`/geo/pincode/${pin}`, token);
      if (d.found) {
        setForm((f) => ({
          ...f,
          state: STATE_LIST.includes(d.state) ? d.state : f.state,
          district: districtsOf(d.state).includes(d.district) ? d.district : f.district,
        }));
        setPinAreas(d.areas || []);
        setPinNote(`${d.district || "?"}, ${d.state || "?"}`);
      } else {
        setPinNote("Couldn't resolve this pincode — pick the district manually.");
      }
    } catch {
      setPinNote("Pincode lookup failed — pick the district manually.");
    } finally {
      setPinLoading(false);
    }
  }

  // Best-effort: ask the backend to delete an orphaned storage object.
  function cancelUpload(key) {
    if (key) apiPost("/uploads/cancel", { key }, token).catch(() => {});
  }

  // ── Existing (already-saved) images — edit mode ──────────────────────────
  async function removeExistingImage(imageId) {
    try {
      await apiDelete(`/properties/${existing.id}/images/${imageId}`, token);
      setExistingImages((imgs) => imgs.filter((i) => i.id !== imageId));
    } catch (e) {
      setError(e.message);
    }
  }

  async function moveExistingImage(index, dir) {
    const j = index + dir;
    if (j < 0 || j >= existingImages.length) return;
    const next = [...existingImages];
    [next[index], next[j]] = [next[j], next[index]];
    setExistingImages(next);
    try {
      await apiPatch(
        `/properties/${existing.id}/images/order`,
        { order: next.map((img) => img.id) },
        token
      );
    } catch (e) {
      setError(e.message);
    }
  }

  // ── Newly picked images — validate size, then upload immediately ─────────
  async function addImages(fileList) {
    setError("");
    for (const file of Array.from(fileList)) {
      // Client-side size check (server re-checks at presign).
      if (file.size > limits.image.maxBytes) {
        setError(`"${file.name}" is too large. Photos must be ${limits.image.maxMb} MB or less.`);
        continue;
      }

      const id = ++pickSeq;
      const item = { id, preview: URL.createObjectURL(file), status: "uploading", key: null, progress: 0 };
      setImages((prev) => [...prev, item]);

      const setProgress = (p) =>
        setImages((prev) => prev.map((x) => (x.id === id ? { ...x, progress: p } : x)));

      try {
        const presigned = await apiPost(
          "/uploads/presign",
          { folder: "image", fileName: file.name, mimeType: file.type, size: file.size },
          token
        );
        await uploadToPresignedUrl(presigned, file, setProgress);
        setImages((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "done", key: presigned.key, progress: 100 } : x))
        );
      } catch (e) {
        setImages((prev) =>
          prev.map((x) => (x.id === id ? { ...x, status: "error", error: e.message } : x))
        );
      }
    }
  }

  function removeImage(index) {
    const item = imagesRef.current[index];
    if (item) {
      URL.revokeObjectURL(item.preview);
      cancelUpload(item.key);
    }
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  function moveImage(index, dir) {
    setImages((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  }

  // ── Newly picked video — validate size, upload, replace any prior pick ────
  async function pickVideo(file) {
    setError("");
    // Drop a previously-picked-but-unsubmitted video first.
    if (videoRef.current?.key) cancelUpload(videoRef.current.key);
    if (!file) return setVideo(null);

    if (file.size > limits.video.maxBytes) {
      setVideo(null);
      setError(`That video is too large. Videos must be ${limits.video.maxMb} MB or less.`);
      return;
    }

    const tag = ++pickSeq; // ignore progress from a superseded pick
    setVideo({ tag, name: file.name, status: "uploading", key: null, progress: 0 });

    const setProgress = (p) =>
      setVideo((v) => (v && v.tag === tag ? { ...v, progress: p } : v));

    try {
      const presigned = await apiPost(
        "/uploads/presign",
        { folder: "video", fileName: file.name, mimeType: file.type, size: file.size },
        token
      );
      await uploadToPresignedUrl(presigned, file, setProgress);
      setVideo((v) => (v && v.tag === tag ? { ...v, status: "done", key: presigned.key, progress: 100 } : v));
    } catch (e) {
      setVideo((v) => (v && v.tag === tag ? { ...v, status: "error", error: e.message } : v));
    }
  }

  function removeVideo() {
    if (videoRef.current?.key) cancelUpload(videoRef.current.key);
    setVideo(null);
  }

  // Revoke leftover preview URLs when the form unmounts (avoids leaks).
  useEffect(() => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview)), []);

  // Cancel button: drop any uploaded-but-unsubmitted objects, then leave.
  function handleCancel() {
    imagesRef.current.forEach((img) => cancelUpload(img.key));
    cancelUpload(videoRef.current?.key);
    router.push("/owner");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setShowErrors(true);
    if (!form.title.trim() || !pincodeReady || !form.district) {
      return setError("Please fix the highlighted fields above.");
    }

    // Don't submit while attachments are still uploading or have failed.
    if (anyUploading) return setError(UPLOADING_MSG);
    if (anyFailed) return setError(FAILED_MSG);

    setLoading(true);
    try {
      // 1. Create or update the property record.
      let propertyId = existing?.id;
      const payload = {
        ...form,
        rent_amount: form.rent_amount === "" ? 0 : Number(form.rent_amount),
        max_persons: form.max_persons === "" ? null : Number(form.max_persons),
      };
      if (isEdit) {
        await apiPatch(`/properties/${propertyId}`, payload, token);
      } else {
        const res = await apiPost("/properties", payload, token);
        propertyId = res.property.id;
      }

      // 2. Attach the uploaded image keys, in the order the owner arranged them.
      const imageKeys = images.filter((i) => i.status === "done" && i.key).map((i) => i.key);
      if (imageKeys.length) {
        await apiPost(`/properties/${propertyId}/images`, { keys: imageKeys }, token);
      }

      // 3. Attach the uploaded video key, if any.
      if (video?.status === "done" && video.key) {
        await apiPost(`/properties/${propertyId}/video`, { key: video.key }, token);
      }

      router.push("/owner");
    } catch (err) {
      setError(err.message || "Couldn’t save the property");
      setLoading(false);
    }
  }

  const field =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-emerald-500";
  const label = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      <div>
        <label className={label}>Title *</label>
        <input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="e.g. Cozy 1BHK near MG Road"
          className={`${field} ${titleErr ? "border-red-400" : ""}`}
        />
        {titleErr && <p className="mt-1 text-xs text-red-600">Title is required.</p>}
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Describe the place…" className={field} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label}>Rental type</label>
          <select value={form.property_type} onChange={(e) => set("property_type", e.target.value)} className={`${field} capitalize`}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Rent (₹ / month)</label>
          {/* Strip anything but digits/decimal so a negative (or "e") can't be typed. */}
          <input
            type="number"
            min={0}
            value={form.rent_amount}
            onChange={(e) => set("rent_amount", e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="18000"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Max persons</label>
          {/* Digits only → no negatives, no decimals. */}
          <input
            type="number"
            min={0}
            value={form.max_persons}
            onChange={(e) => set("max_persons", e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="4"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Current status</label>
          <select value={form.occupancy_status} onChange={(e) => set("occupancy_status", e.target.value)} className={field}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Location — State (locked) / Pincode (autofills district) / District */}
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={label}>State</label>
          <select
            value={form.state}
            onChange={(e) => set("state", e.target.value)}
            disabled
            title="More states coming soon"
            className={`${field} cursor-not-allowed bg-slate-100 text-slate-500`}
          >
            {STATE_LIST.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Pincode *</label>
          <input
            inputMode="numeric"
            value={form.pincode}
            onChange={(e) => onPincodeChange(e.target.value)}
            placeholder="e.g. 682030"
            className={`${field} ${pinErr ? "border-red-400" : ""}`}
          />
          {pinErr ? (
            <p className="mt-1 text-xs text-red-600">Enter a valid 6-digit pincode.</p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">
              {pinLoading ? "Looking up…" : pinNote || "Enter this first — it fills the district."}
            </p>
          )}
        </div>
        <div>
          <label className={label}>District *</label>
          <select
            value={form.district}
            onChange={(e) => set("district", e.target.value)}
            disabled={!pincodeReady || pinLoading}
            className={`${field} ${!pincodeReady || pinLoading ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""} ${
              distErr ? "border-red-400" : ""
            }`}
          >
            <option value="">
              {pinLoading ? "Loading district…" : pincodeReady ? "Select district" : "Enter pincode first"}
            </option>
            {districtsOf(form.state).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          {distErr && <p className="mt-1 text-xs text-red-600">Please select a district.</p>}
        </div>
      </div>

      {locationLocked && (
        <p className="text-xs text-amber-600">Select a district first to add the town, landmark and address.</p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={label}>Town / Locality</label>
          <select
            value={localityOther ? "__other__" : localityOptions.includes(form.city) ? form.city : ""}
            onChange={(e) => onLocalitySelect(e.target.value)}
            disabled={locationLocked}
            className={`${field} ${locationLocked ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
          >
            <option value="">{locationLocked ? "Select a district first" : "Select locality"}</option>
            {localityOptions.map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="__other__">Other (add new)…</option>
          </select>

          {localityOther && !locationLocked && (
            <>
              <input
                list="locality-other-list"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                onBlur={normalizeLocalityInput}
                placeholder="Type the locality / area name"
                className={`${field} mt-2`}
              />
              <datalist id="locality-other-list">
                {localityOptions.map((l) => <option key={l} value={l} />)}
              </datalist>
              <p className="mt-1 text-xs text-slate-500">
                New locality will be saved under pincode{" "}
                <span className="font-medium">{form.pincode}</span>.
              </p>
            </>
          )}
        </div>
        <div>
          <label className={label}>Landmark</label>
          <input
            value={form.landmark}
            onChange={(e) => set("landmark", e.target.value)}
            disabled={locationLocked}
            placeholder="e.g. near Infopark"
            className={`${field} ${locationLocked ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
          />
        </div>
      </div>

      <div>
        <label className={label}>Address</label>
        <textarea
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          disabled={locationLocked}
          rows={4}
          placeholder="House / building, street, area…"
          className={`${field} ${locationLocked ? "cursor-not-allowed bg-slate-100 text-slate-400" : ""}`}
        />
      </div>

      <div>
        <label className={label}>Google Maps link</label>
        <input value={form.map_link} onChange={(e) => set("map_link", e.target.value)} placeholder="https://maps.google.com/?q=…" className={field} />
      </div>

      {/* Features & policies — ALL optional. Amenities is a multi-select (tap the
          chips); furnishing + the policies are single-select dropdowns. */}
      <div className="rounded-xl border border-slate-200 p-4 space-y-5">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Features &amp; policies</h3>
          <p className="text-xs text-slate-500">Optional — fill in whatever applies to help seekers.</p>
        </div>

        <div>
          <label className={label}>
            Amenities <span className="font-normal text-slate-400">(tap to select all that apply)</span>
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {AMENITIES.map((a) => {
              const on = (form.amenities || []).includes(a.value);
              return (
                <button
                  type="button"
                  key={a.value}
                  onClick={() => toggleAmenity(a.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm transition ${
                    on
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-300 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  {on ? "✓ " : ""}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className={label}>Furnishing</label>
            <select value={form.furnishing} onChange={(e) => set("furnishing", e.target.value)} className={field}>
              <option value="">Not specified</option>
              {FURNISHING.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Pets</label>
            <select value={form.pets_allowed} onChange={(e) => set("pets_allowed", e.target.value)} className={field}>
              <option value="">Not specified</option>
              {PETS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Electricity bill</label>
            <select value={form.electricity_billing} onChange={(e) => set("electricity_billing", e.target.value)} className={field}>
              <option value="">Not specified</option>
              {ELECTRICITY.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Preferred tenant</label>
            <select value={form.preferred_tenant} onChange={(e) => set("preferred_tenant", e.target.value)} className={field}>
              <option value="">Any</option>
              {PREFERRED_TENANT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={label}>Food (PG / hostel)</label>
            <select value={form.food_included} onChange={(e) => set("food_included", e.target.value)} className={field}>
              <option value="">Not specified</option>
              {FOOD.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Existing images (edit mode) — reorderable, first one is the cover */}
      {isEdit && existingImages.length > 0 && (
        <div>
          <label className={label}>Current photos</label>
          <p className="mt-0.5 text-xs text-slate-500">
            The first photo is the{" "}
            <span className="font-medium text-emerald-700">cover</span> seekers see first. Use ◀ ▶
            to arrange.
          </p>
          <div className="mt-2 flex flex-wrap gap-3">
            {existingImages.map((img, i) => (
              <PhotoTile
                key={img.id}
                src={img.image_url}
                index={i}
                total={existingImages.length}
                isCover={i === 0}
                onMove={(dir) => moveExistingImage(i, dir)}
                onRemove={() => removeExistingImage(img.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add / arrange new images */}
      <div>
        <label className={label}>{isEdit ? "Add more photos" : "Photos"}</label>
        {!isEdit && (
          <p className="mt-0.5 text-xs text-slate-500">
            The first photo is the{" "}
            <span className="font-medium text-emerald-700">cover</span> seekers see first. Use ◀ ▶
            to arrange.
          </p>
        )}
        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-3">
            {images.map((img, i) => (
              <PhotoTile
                key={img.id}
                src={img.preview}
                index={i}
                total={images.length}
                isCover={!isEdit && i === 0}
                status={img.status}
                progress={img.progress}
                onMove={(dir) => moveImage(i, dir)}
                onRemove={() => removeImage(i)}
              />
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            addImages(e.target.files);
            e.target.value = ""; // allow re-picking the same file
          }}
          className="mt-2 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-emerald-700"
        />
        <p className="mt-1 text-xs text-slate-400">Max {limits.image.maxMb} MB per photo.</p>
        {isEdit && images.length > 0 && (
          <p className="mt-1 text-xs text-slate-500">New photos are added after the current ones.</p>
        )}
      </div>

      {/* Video */}
      <div>
        <label className={label}>Video {existing?.video_url ? "(replaces current)" : "(optional)"}</label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => {
            pickVideo(e.target.files[0] || null);
            e.target.value = "";
          }}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-slate-800"
        />
        {video && (
          <p className="mt-1 flex items-center gap-2 text-xs">
            <span className="max-w-[16rem] truncate text-slate-600">{video.name}</span>
            {video.status === "uploading" && (
              <span className="text-slate-500">uploading… {video.progress ?? 0}%</span>
            )}
            {video.status === "done" && <span className="text-emerald-600">ready ✓</span>}
            {video.status === "error" && <span className="text-red-600">upload failed</span>}
            <button type="button" onClick={removeVideo} className="text-red-600 underline">
              remove
            </button>
          </p>
        )}
        {video?.status === "uploading" && (
          <div className="mt-1 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${video.progress ?? 0}%` }}
            />
          </div>
        )}
        <p className="mt-1 text-xs text-slate-400">Max {limits.video.maxMb} MB.</p>
        {existing?.video_url && !video && (
          <p className="mt-1 text-xs text-slate-500">A video is already uploaded.</p>
        )}
      </div>

      {/* Summary shown next to the button so a long form doesn't hide the reason. */}
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Saving…" : isEdit ? "Save changes" : "Create listing"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// A photo thumbnail with a cover badge, reorder (◀ ▶) and remove (✕) controls.
// `status`/`progress` (optional) show an upload overlay for newly-picked images.
function PhotoTile({ src, index, total, isCover, status, progress, onMove, onRemove }) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {isCover && (
        <span className="absolute left-0 top-0 rounded-br-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Cover
        </span>
      )}
      {status === "uploading" && (
        <span className="absolute inset-0 grid place-items-center bg-black/50 text-xs font-semibold text-white">
          {progress ?? 0}%
        </span>
      )}
      {status === "error" && (
        <span className="absolute inset-0 grid place-items-center bg-red-600/70 text-[10px] font-medium text-white">
          failed
        </span>
      )}
      <button
        type="button"
        onClick={onRemove}
        title="Remove"
        className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-red-600 text-xs text-white"
      >
        ✕
      </button>
      <div className="absolute inset-x-0 bottom-0 flex justify-between bg-black/45 text-white">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onMove(-1)}
          title="Move earlier"
          className="px-2 py-0.5 disabled:opacity-30"
        >
          ◀
        </button>
        <button
          type="button"
          disabled={index === total - 1}
          onClick={() => onMove(1)}
          title="Move later"
          className="px-2 py-0.5 disabled:opacity-30"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
