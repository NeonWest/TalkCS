import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface Props {
    value: string;
    onChange: (value: string) => void;
    rows?: number;
    placeholder?: string;
    className?: string;
}

export default function MarkdownEditor({ value, onChange, rows = 5, placeholder = 'Write markdown...', className = '' }: Props) {
    const [tab, setTab] = useState<'write' | 'preview'>('write');

    return (
        <div className={`border border-white/15 rounded-lg overflow-hidden ${className}`}>
            <div className="flex border-b border-white/15 bg-[#1a1a1a]">
                <button
                    type="button"
                    onClick={() => setTab('write')}
                    className={`px-4 py-1.5 text-xs font-medium transition ${tab === 'write' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Write
                </button>
                <button
                    type="button"
                    onClick={() => setTab('preview')}
                    className={`px-4 py-1.5 text-xs font-medium transition ${tab === 'preview' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                    Preview
                </button>
            </div>
            {tab === 'write' ? (
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    rows={rows}
                    placeholder={placeholder}
                    className="w-full bg-[#242424] px-4 py-2 text-base text-gray-100 focus:outline-none resize-none"
                />
            ) : (
                <div className="min-h-[80px] px-4 py-3 bg-[#242424] prose prose-invert prose-sm max-w-none">
                    {value.trim() ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                            {value}
                        </ReactMarkdown>
                    ) : (
                        <span className="text-gray-500 text-sm">Nothing to preview.</span>
                    )}
                </div>
            )}
        </div>
    );
}
