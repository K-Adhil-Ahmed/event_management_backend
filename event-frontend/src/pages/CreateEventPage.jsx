import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CreateEventPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    total_seats: "",
    cost: 0,
    contact_number: "",
    poster_url: "",
    category: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        ...form,
        total_seats: parseInt(form.total_seats),
        cost: parseInt(form.cost) || 0,
        date: new Date(form.date).toISOString(),
      };
      const res = await api.post("/events/", payload);
      navigate(`/events/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold mb-1">Create Event</h1>
      <p className="text-zinc-500 text-sm mb-6">Fill in the details for your event</p>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-3 py-2 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Title *">
          <input
            required
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Description">
          <textarea
            rows={3}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Date & Time *">
            <input
              type="datetime-local"
              required
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Total Seats *">
            <input
              type="number"
              min={1}
              required
              value={form.total_seats}
              onChange={(e) => set("total_seats", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Location *">
          <input
            required
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cost (₹)">
            <input
              type="number"
              min={0}
              value={form.cost}
              onChange={(e) => set("cost", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <input
              value={form.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="e.g. Tech, Music"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Contact Number">
          <input
            value={form.contact_number}
            onChange={(e) => set("contact_number", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Poster URL (optional)">
          <input
            type="url"
            value={form.poster_url}
            onChange={(e) => set("poster_url", e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-amber-400 text-zinc-950 font-semibold px-6 py-2 rounded hover:bg-amber-300 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Event"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/events")}
            className="border border-zinc-700 text-zinc-400 px-6 py-2 rounded hover:border-zinc-500 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputClass =
  "w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-amber-400";

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-sm text-zinc-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
