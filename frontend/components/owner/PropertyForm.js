"use client";

// Shared form for creating AND editing a property.
// Pass `existing` = a property object to edit, or null to create.
//
// Save flow:
//   create → POST /properties → then upload images + video to the new id
//   edit   → PATCH /properties/:id → then upload any newly added images + video
// Files are saved to the backend's local upload folder (later: Contabo bucket —
// no frontend change needed, the URLs just point elsewhere).

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiPost, apiPatch, apiUpload, apiDelete } from "@/lib/api";
import { getUserToken } from "@/lib/userAuth";

const TYPES = ["room", "apartment", "house", "pg", "hostel", "shared"];
const STATUSES = [
  { value: "available", label: "Available" },
  { value: "partially_occupied", label: "Partially occupied" },
  { value: "occupied", label: "Occupied" },
];

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
    city: existing?.city || "",
    district: existing?.district || "",
    address: existing?.address || "",
    map_link: existing?.map_link || "",
  });

  const [images, setImages] = useState([]); // newly picked images: [{ file, preview }]
  const [video, setVideo] = useState(null); // newly picked video File
  const [existingImages, setExistingImages] = useState(existing?.images || []);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Delete one already-saved image (edit mode).
  async function removeExistingImage(imageId) {
    try {
      await apiDelete(`/properties/${existing.id}/images/${imageId}`, token);
      setExistingImages((imgs) => imgs.filter((i) => i.id !== imageId));
    } catch (e) {
      setError(e.message);
    }
  }

  // Reorder already-saved images (edit mode). Index 0 is the cover photo seekers
  // see first. Persists immediately since the property already exists.
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

  // Newly picked images (not yet uploaded). Kept with a preview URL so the owner
  // can arrange them before saving. They upload in this order.
  function addImages(fileList) {
    const picked = Array.from(fileList).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setImages((prev) => [...prev, ...picked]);
  }

  function removeImage(index) {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
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

  // Revoke any leftover preview URLs when the form unmounts (avoids leaks).
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((img) => URL.revokeObjectURL(img.preview)), []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) return setError("Title is required.");

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

      // 2. Upload any newly added images, in the order the owner arranged them.
      if (images.length) {
        const fd = new FormData();
        images.forEach(({ file }) => fd.append("images", file));
        await apiUpload(`/properties/${propertyId}/images`, fd, token);
      }

      // 3. Upload a video if one was picked.
      if (video) {
        const fd = new FormData();
        fd.append("video", video);
        await apiUpload(`/properties/${propertyId}/video`, fd, token);
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
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div>
        <label className={label}>Title *</label>
        <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Cozy 1BHK near MG Road" className={field} />
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
          <input type="number" value={form.rent_amount} onChange={(e) => set("rent_amount", e.target.value)} placeholder="18000" className={field} />
        </div>
        <div>
          <label className={label}>Max persons</label>
          <input type="number" value={form.max_persons} onChange={(e) => set("max_persons", e.target.value)} placeholder="4" className={field} />
        </div>
        <div>
          <label className={label}>Current status</label>
          <select value={form.occupancy_status} onChange={(e) => set("occupancy_status", e.target.value)} className={field}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label className={label}>City</label>
          <input value={form.city} onChange={(e) => set("city", e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>District / area</label>
          <input value={form.district} onChange={(e) => set("district", e.target.value)} className={field} />
        </div>
        <div>
          <label className={label}>Address</label>
          <input value={form.address} onChange={(e) => set("address", e.target.value)} className={field} />
        </div>
      </div>

      <div>
        <label className={label}>Google Maps link</label>
        <input value={form.map_link} onChange={(e) => set("map_link", e.target.value)} placeholder="https://maps.google.com/?q=…" className={field} />
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
                key={img.preview}
                src={img.preview}
                index={i}
                total={images.length}
                isCover={!isEdit && i === 0}
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
          onChange={(e) => setVideo(e.target.files[0] || null)}
          className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-slate-800"
        />
        {existing?.video_url && !video && (
          <p className="mt-1 text-xs text-slate-500">A video is already uploaded.</p>
        )}
      </div>

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
          onClick={() => router.push("/owner")}
          className="rounded-lg border border-slate-300 px-6 py-2.5 font-medium text-slate-600 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// A photo thumbnail with a cover badge, reorder (◀ ▶) and remove (✕) controls.
function PhotoTile({ src, index, total, isCover, onMove, onRemove }) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-lg border border-slate-200">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="h-full w-full object-cover" />
      {isCover && (
        <span className="absolute left-0 top-0 rounded-br-md bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          Cover
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
