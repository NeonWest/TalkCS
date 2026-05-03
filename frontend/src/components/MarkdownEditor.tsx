import MDEditor from '@uiw/react-md-editor';
import '@uiw/react-md-editor/markdown-editor.css';
import { useTheme } from '../context/useTheme';

interface Props {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    className?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder = 'Write...', className = '' }: Props) {
    const { theme } = useTheme();
    const colorMode = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme;

    return (
        <div className={className} data-color-mode={colorMode}>
            <MDEditor
                value={value}
                onChange={v => onChange(v ?? '')}
                preview="edit"
                hideToolbar={false}
                visibleDragbar={false}
                textareaProps={{ placeholder }}
                height={200}
                style={{ borderRadius: '8px' }}
            />
        </div>
    );
}
