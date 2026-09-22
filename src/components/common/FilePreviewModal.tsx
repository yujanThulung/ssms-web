import { Modal, Image, Button } from 'antd'
import { colors } from '../../lib/designTokens'

export interface FilePreviewDoc {
  url: string
  title: string
  fileName?: string
}

interface FilePreviewModalProps {
  doc: FilePreviewDoc | null
  onClose: () => void
}

function isPdf(url: string, fileName?: string): boolean {
  if (fileName?.toLowerCase().endsWith('.pdf')) return true
  const lower = url.toLowerCase()
  return lower.includes('.pdf') || lower.includes('/pdf/')
}

/**
 * FilePreviewModal
 *
 * A reusable modal that previews a document in-app:
 * - Images → rendered with Ant Design <Image /> (zoomable)
 * - PDFs   → embedded in an <iframe>
 *
 * Usage:
 *   const [previewDoc, setPreviewDoc] = useState<FilePreviewDoc | null>(null)
 *   <FilePreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
 */
export function FilePreviewModal({ doc, onClose }: FilePreviewModalProps) {
  return (
    <Modal
      title={
        <div>
          <span style={{ fontWeight: 600 }}>{doc?.title}</span>
          {doc?.fileName && (
            <span style={{ fontSize: 12, color: colors.muted, marginLeft: 8, fontWeight: 400 }}>
              ({doc.fileName})
            </span>
          )}
        </div>
      }
      open={!!doc}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
      ]}
      width={850}
      centered
      destroyOnClose
    >
      {doc && (
        <div
          style={{
            minHeight: 350,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f8fafc',
            padding: 12,
            borderRadius: 8,
          }}
        >
          {isPdf(doc.url, doc.fileName) ? (
            <iframe
              src={doc.url}
              title={doc.title}
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 6 }}
            />
          ) : (
            <Image
              src={doc.url}
              alt={doc.title}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
            />
          )}
        </div>
      )}
    </Modal>
  )
}
