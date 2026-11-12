// El texto de una nota (lib/blog.ts parseRichText): párrafos, listas,
// negrita, cursiva y links. Elementos de React, nunca HTML crudo.
import Link from "next/link"
import { Fragment } from "react"
import { isExternal, parseInline, parseRichText, type Inline } from "@/lib/blog"

function InlineText({ parts }: { parts: Inline[] }) {
  return (
    <>
      {parts.map((part, i) => {
        if (part.t === "br") return <br key={i} />
        if (part.t === "b") return <strong key={i}>{part.v}</strong>
        if (part.t === "i") return <em key={i}>{part.v}</em>
        if (part.t === "link") {
          return isExternal(part.href)
            ? <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">{part.v}</a>
            : <Link key={i} href={part.href}>{part.v}</Link>
        }
        return <Fragment key={i}>{part.v}</Fragment>
      })}
    </>
  )
}

export function RichInline({ text }: { text: string }) {
  return <InlineText parts={parseInline(text)} />
}

export default function RichText({ text }: { text: string }) {
  return (
    <div className="blog-rich">
      {parseRichText(text).map((block, i) =>
        block.kind === "ul" ? (
          <ul key={i}>{block.items.map((item, j) => <li key={j}><InlineText parts={item} /></li>)}</ul>
        ) : (
          <p key={i}><InlineText parts={block.inline} /></p>
        ),
      )}
    </div>
  )
}
