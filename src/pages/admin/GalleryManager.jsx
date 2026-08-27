import React, { useEffect, useState } from "react";
import { ref, onValue, push, remove } from "firebase/database";
import { rtdb } from "../../firebase";
import { format } from "date-fns";
import { Plus, Trash2, Image, X, Save, CheckCircle, ExternalLink } from "lucide-react";
import { useConfirm } from "../../contexts/ConfirmContext";
import PreviewRows from "../../components/ui/PreviewRows";

const EMPTY_FORM = { imageUrl: "", caption: "" };

export default function GalleryManager() {
  const { confirm } = useConfirm();
  const [photos, setPhotos] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const unsub = onValue(ref(rtdb, "gallery"), (snap) => {
      if (snap.exists()) {
        setPhotos(
          Object.entries(snap.val())
            .map(([id, v]) => ({ id, ...v }))
            .sort((a, b) => b.timestamp - a.timestamp)
        );
      } else {
        setPhotos([]);
      }
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.imageUrl.trim()) return;
    const ok = await confirm({
      title: "Add photo to gallery?",
      body: "The photo will be visible to everyone in the community gallery.",
      confirmText: "Add",
      icon: "photo_library",
      preview: (
        <div className="space-y-2">
          {form.imageUrl && (
            <img
              src={form.imageUrl.trim()}
              alt="Preview"
              onError={(ev) => (ev.currentTarget.style.display = "none")}
              className="w-full h-32 object-cover rounded-xl"
            />
          )}
          <PreviewRows rows={[{ label: "Caption", value: form.caption.trim() || "—" }]} />
        </div>
      ),
    });
    if (!ok) return;
    setSaving(true);
    try {
      await push(ref(rtdb, "gallery"), {
        imageUrl: form.imageUrl.trim(),
        caption: form.caption.trim(),
        timestamp: Date.now(),
        uploadedAt: new Date().toISOString(),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setShowForm(false); setForm(EMPTY_FORM); }, 1500);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = await confirm({
      title: "Remove photo?",
      body: "This deletes the photo from the community gallery.",
      confirmText: "Remove",
      danger: true,
      icon: "delete",
    });
    if (!ok) return;
    await remove(ref(rtdb, `gallery/${id}`));
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Gallery Manager</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Add photos by pasting external image URLs (Cloudinary, Google Drive, etc.)
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Photo
        </button>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="modal-root fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md animate-slide-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Add Gallery Photo</h2>
              <button
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Image URL *</label>
                <input
                  required
                  type="url"
                  className="input-field"
                  placeholder="https://res.cloudinary.com/…/image.jpg"
                  value={form.imageUrl}
                  onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                />
              </div>

              {/* URL Preview */}
              {form.imageUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-100">
                  <img
                    src={form.imageUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                </div>
              )}

              <div>
                <label className="label">Caption (optional)</label>
                <input
                  className="input-field"
                  placeholder="e.g. Eid prayer 2024"
                  value={form.caption}
                  onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2
                  ${saved ? "bg-emerald-100 text-emerald-800" : "btn-primary"}`}
              >
                {saved ? (
                  <><CheckCircle className="w-4 h-4" /> Added!</>
                ) : (
                  <><Save className="w-4 h-4" /> {saving ? "Adding…" : "Add to Gallery"}</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {preview && (
        <div
          className="modal-root fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="max-w-lg w-full animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <img src={preview.imageUrl} alt={preview.caption} className="w-full rounded-2xl max-h-[80vh] object-contain" />
            {preview.caption && <p className="text-white text-center mt-3 text-sm">{preview.caption}</p>}
            <button className="w-full mt-4 py-2.5 rounded-xl bg-white/10 text-white text-sm hover:bg-white/20 transition-colors" onClick={() => setPreview(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Gallery Grid */}
      {photos.length === 0 ? (
        <div className="card text-center py-12 text-slate-400">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No photos yet. Add your first gallery image!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {photos.map((p) => (
            <div key={p.id} className="relative group rounded-2xl overflow-hidden shadow-card cursor-pointer">
              <img
                src={p.imageUrl}
                alt={p.caption || "Gallery"}
                className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onClick={() => setPreview(p)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-2 left-2 right-2 flex items-end gap-2">
                  {p.caption && (
                    <p className="text-white text-xs font-medium truncate flex-1">{p.caption}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleDelete(p.id)}
                className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {p.uploadedAt && (
                <div className="bg-white px-2.5 py-1.5">
                  <p className="text-[10px] text-slate-400 truncate">
                    {p.caption || format(new Date(p.timestamp), "dd MMM yyyy")}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
