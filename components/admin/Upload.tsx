"use client";

import { useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type ParsedLeadRow = {
  business_name: string;
  phone: string;
  email: string;
  website: string;
  location: string;
  profession: string;
  source: string;
};

type UploadProps = {
  onParsed?: (rows: ParsedLeadRow[]) => void;
};

const EXPECTED_COLUMNS = [
  "business name",
  "number",
  "email",
  "website",
  "location",
  "profession",
] as const;

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function splitTabRow(line: string) {
  return line.split("\t").map((cell) => cell.trim());
}

function splitCsvRow(line: string) {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function splitRow(line: string) {
  if (line.includes("\t")) {
    return splitTabRow(line);
  }

  return splitCsvRow(line);
}

function parseTable(input: string) {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      rows: [] as ParsedLeadRow[],
      error: "Paste a header row and at least one data row.",
    };
  }

  const rawHeaders = splitRow(lines[0]);
  const headers = rawHeaders.map(normalizeHeader);

  const missingColumns = EXPECTED_COLUMNS.filter((column) => !headers.includes(column));

  if (missingColumns.length > 0) {
    return {
      rows: [] as ParsedLeadRow[],
      error: `Missing required columns: ${missingColumns.join(", ")}`,
    };
  }

  const columnIndex = {
    business_name: headers.indexOf("business name"),
    phone: headers.indexOf("number"),
    email: headers.indexOf("email"),
    website: headers.indexOf("website"),
    location: headers.indexOf("location"),
    profession: headers.indexOf("profession"),
    source: headers.indexOf("source"),
  };

  const rows = lines.slice(1).map((line) => {
    const cells = splitRow(line);

    return {
      business_name: cells[columnIndex.business_name] || "",
      phone: cells[columnIndex.phone] || "",
      email: cells[columnIndex.email] || "",
      website: cells[columnIndex.website] || "",
      location: cells[columnIndex.location] || "",
      profession: cells[columnIndex.profession] || "",
      source: columnIndex.source !== -1 ? cells[columnIndex.source] || "" : "",
    };
  });

  const filteredRows = rows.filter((row) =>
    Object.values(row).some((value) => value.trim().length > 0),
  );

  return {
    rows: filteredRows,
    error: "",
  };
}

function splitLocation(location: string) {
  const cleaned = location.trim();

  if (!cleaned) {
    return {
      city: "Unknown city",
      country: "Unknown country",
    };
  }

  const parts = cleaned
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 1) {
    return {
      city: parts[0],
      country: "Unknown country",
    };
  }

  return {
    city: parts[0],
    country: parts.slice(1).join(", "),
  };
}

export default function Upload({ onParsed }: UploadProps) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [parsedRows, setParsedRows] = useState<ParsedLeadRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const previewRows = useMemo(() => parsedRows.slice(0, 6), [parsedRows]);

  function handleParse() {
    const result = parseTable(value);
    setError(result.error);
    setSuccess("");
    setParsedRows(result.rows);

    if (!result.error && onParsed) {
      onParsed(result.rows);
    }
  }

  function handleClear() {
    setValue("");
    setError("");
    setSuccess("");
    setParsedRows([]);
  }

  async function getOrCreateProfessionId(name: string) {
    const cleanedName = name.trim() || "Unknown profession";

    const { data: existing, error: existingError } = await supabase
      .from("professions")
      .select("id, name")
      .ilike("name", cleanedName)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      return existing.id;
    }

    const { data: created, error: createError } = await supabase
      .from("professions")
      .insert({
        name: cleanedName,
        is_active: true,
      })
      .select("id")
      .single();

    if (createError) {
      throw createError;
    }

    return created.id;
  }

  async function getOrCreateLocationId(rawLocation: string) {
    const { city, country } = splitLocation(rawLocation);

    const { data: existing, error: existingError } = await supabase
      .from("locations")
      .select("id, city, country")
      .ilike("city", city)
      .ilike("country", country)
      .limit(1)
      .maybeSingle();

    if (existingError) {
      throw existingError;
    }

    if (existing?.id) {
      return existing.id;
    }

    const { data: created, error: createError } = await supabase
      .from("locations")
      .insert({
        city,
        country,
        is_active: true,
      })
      .select("id")
      .single();

    if (createError) {
      throw createError;
    }

    return created.id;
  }

  async function handleUpload() {
    if (parsedRows.length === 0) {
      setError("Parse the table first before uploading.");
      setSuccess("");
      return;
    }

    const confirmed = window.confirm(
      `Upload ${parsedRows.length} lead${parsedRows.length === 1 ? "" : "s"} to Supabase?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      const payload = [];

      for (const row of parsedRows) {
        const professionId = await getOrCreateProfessionId(row.profession);
        const locationId = await getOrCreateLocationId(row.location);

        payload.push({
          business_name: row.business_name || "Unknown business",
          phone: row.phone || null,
          email: row.email || null,
          website: row.website || null,
          profession_id: professionId,
          location_id: locationId,
          source: row.source || (row.website ? "bad website" : "no website"),
          status: "new",
          notes: null,
        });
      }

      const { error: insertError } = await supabase.from("leads").insert(payload);

      if (insertError) {
        throw insertError;
      }

      setSuccess(`Uploaded ${payload.length} lead${payload.length === 1 ? "" : "s"} to Supabase.`);
      setParsedRows([]);
      setValue("");
    } catch (uploadError) {
      const message = uploadError instanceof Error ? uploadError.message : "Upload failed.";
      setError(message);
      setSuccess("");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Upload leads from a copied table
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Paste rows copied from Excel, Google Sheets, or a CSV. Required columns:
            business name, number, email, website, location, profession.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-medium text-slate-800">Expected format</p>
          <p className="mt-2 whitespace-pre-wrap font-mono text-xs leading-6 text-slate-600">
            {`business name\tnumber\temail\twebsite\tlocation\tprofession\tsource\nOmino Digital\t+44 7700 900123\thello@omino.com\tomino.com\tLondon, UK\tAccountant\tbad website`}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Paste table
        </label>
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste your copied table here..."
          className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-[#2563eb] focus:bg-white"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleParse}
          className="rounded-2xl bg-[#2563eb] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Parse table
        </button>

        <button
          type="button"
          onClick={handleUpload}
          disabled={parsedRows.length === 0 || isUploading}
          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Uploading..." : "Confirm & Upload"}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={isUploading}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      {parsedRows.length > 0 ? (
        <div className="mt-6 rounded-[24px] border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Preview</h3>
              <p className="mt-1 text-sm text-slate-500">
                Parsed {parsedRows.length} row{parsedRows.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Business name</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Number</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Email</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Website</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Location</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Profession</th>
                  <th className="border-b border-slate-200 px-3 py-3 font-semibold text-slate-700">Source</th>
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, index) => (
                  <tr key={`${row.business_name}-${index}`}>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-800">{row.business_name || "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.phone || "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.email || "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.website || "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.location || "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.profession || "-"}</td>
                    <td className="border-b border-slate-100 px-3 py-3 text-slate-600">{row.source || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </section>
  );
}