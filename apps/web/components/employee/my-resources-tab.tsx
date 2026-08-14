'use client';

interface MyResourcesTabProps {
  resources: { links: any[]; documents: any[] };
}

export function MyResourcesTab({ resources }: MyResourcesTabProps) {
  const links = resources?.links || [];
  const docs = resources?.documents || [];

  return (
    <div className="space-y-8">
      <div className="bg-[#151c2e] p-4 rounded-xl border border-[#182238]">
        <h3 className="text-sm font-semibold text-white">My Project Resources & Documents</h3>
        <p className="text-xs text-[#94a3b8]">
          Authorized external repository links (GitHub, Figma, Notion) and project technical documents
        </p>
      </div>

      {/* External Links */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">
          Shared Repositories & External Links ({links.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: any) => (
            <div key={link.id} className="p-4 bg-[#151c2e] rounded-xl border border-[#182238] space-y-2">
              <span className="text-[10px] font-mono text-[#d49b38] block">{link.project?.projectCode}</span>
              <h5 className="text-xs font-semibold text-white">{link.title}</h5>
              {link.description && <p className="text-[11px] text-[#94a3b8] line-clamp-2">{link.description}</p>}
              <div className="pt-2 border-t border-[#182238]">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition truncate max-w-[200px] block"
                >
                  Open Resource ↗
                </a>
              </div>
            </div>
          ))}
          {links.length === 0 && (
            <div className="col-span-full p-6 text-center bg-[#151c2e] rounded-xl border border-[#182238] text-xs text-[#64748b]">
              No shared external resource links available.
            </div>
          )}
        </div>
      </div>

      {/* Documents */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[#94a3b8] mb-3">
          Authorized Technical Documents ({docs.length})
        </h4>
        <div className="bg-[#151c2e] rounded-xl border border-[#182238] overflow-hidden">
          {docs.length > 0 ? (
            <table className="w-full text-left text-xs text-white">
              <thead className="bg-[#0b101b] text-[#94a3b8] text-[10px] uppercase border-b border-[#182238]">
                <tr>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Uploaded By</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#182238]">
                {docs.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-[#182238]/40 transition">
                    <td className="px-4 py-3 font-medium">{doc.title || doc.fileName || doc.storageKey}</td>
                    <td className="px-4 py-3 text-[#94a3b8]">{doc.uploader?.email || 'System'}</td>
                    <td className="px-4 py-3 text-[#94a3b8]">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={`/api/v1/documents/${doc.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
                      >
                        Download ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-xs text-[#64748b]">
              No technical documents available for your assigned projects.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
