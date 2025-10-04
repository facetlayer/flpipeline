import matter from 'gray-matter';

export interface ParsedFrontmatter {
    frontmatter: Record<string, string>;
    body: string;
}

export function parseFrontmatter(content: string): ParsedFrontmatter {
    const result = matter(content);

    return {
        frontmatter: result.data as Record<string, string>,
        body: result.content
    };
}
