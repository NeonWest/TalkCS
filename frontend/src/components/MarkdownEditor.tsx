import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';

interface Props {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    className?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Write...', className = '' }: Props) {
    return (
        <div className={className} data-color-mode="dark">
            <MDEditor
                value={value}
                onChange={v => onChange(v ?? '')}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                textareaProps={{ placeholder }}
                height={200}
                style={{ background: '#242424', borderRadius: '8px' }}
            />
        </div>
    );
}
