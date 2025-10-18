'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';

interface MarkdownProps {
  text: string;
}

export default function Markdown({ text }: MarkdownProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
          .prose blockquote p:first-of-type::before {
            content: open-quote;
            position: absolute;
            font-size: 0;
            font-family: Times;
            font-weight: 900;
            opacity: 0.1;
            top: -15px;
            left: 10px;
          }
          .prose blockquote p:last-of-type::after {
            content: close-quote;
            position: absolute;
            font-size: 36pt;
            font-family: Times;
            font-weight: 900;
            opacity: 0.1;
            bottom: -25px;
            right: 10px;
          }
        `
      }} />
      <div 
        className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-3 prose-h3:text-base prose-h3:mt-4 prose-h3:mb-2 prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-strong:font-semibold prose-ul:text-gray-700 prose-ol:text-gray-700 prose-li:text-gray-700 prose-li:leading-relaxed prose-blockquote:pl-4 prose-blockquote:py-2 prose-blockquote:text-gray-700 prose-blockquote:italic"
        style={{
          '--tw-prose-quote-borders': 'rgba(243, 244, 246, var(--tw-bg-opacity, 1))'
        } as React.CSSProperties}
      >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" />
          ),
          blockquote: ({ children, ...props }) => (
            <blockquote 
              {...props} 
              style={{
                backgroundColor: 'rgba(243, 244, 246, var(--tw-bg-opacity, 1))',
                padding: '1rem 1.5rem',
                fontStyle: 'italic',
                color: 'rgb(55, 65, 81)',
                borderRadius: '1rem',
                fontFamily: 'Times New Roman, serif',
                fontSize: '1.125rem',
                border: 'none',
                position: 'relative'
              }}
            >
              {children}
            </blockquote>
          ),
          p: ({ children, ...props }) => (
            <p {...props} style={{ margin: 0 }}>
              {children}
            </p>
          ),
          code(props: any) {
            const { inline, className, children, ...rest } = props || {};
            const match = /language-(\w+)/.exec(className || '');
            if (inline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm" {...rest}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-900 text-gray-100 text-xs p-3 rounded-md overflow-x-auto">
                <code className={className || ''}>
                  {children}
                </code>
              </pre>
            );
          }
        }}
      >
        {text}
      </ReactMarkdown>
      </div>
    </>
  );
}


