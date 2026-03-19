<?php

namespace App\Support;

class PasteHighlighter
{
    /**
     * @return array<int, array<int, array{content: string, type: string}>>
     */
    public function highlight(string $content, string $syntax): array
    {
        $normalizedSyntax = strtolower($syntax);
        $lines = preg_split('/\r\n|\r|\n/', $content) ?: [''];

        return array_map(fn (string $line): array => $this->tokenizeLine($line, $normalizedSyntax), $lines);
    }

    /**
     * @return array<int, array{content: string, type: string}>
     */
    protected function tokenizeLine(string $line, string $syntax): array
    {
        if ($line === '') {
            return [
                [
                    'content' => '',
                    'type' => 'plain',
                ],
            ];
        }

        $pattern = match ($syntax) {
            'json' => '/("(?:\\\\.|[^"\\\\])*"(?=\s*:))|("(?:\\\\.|[^"\\\\])*")|\b(true|false|null)\b|\b-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?\b/',
            'javascript', 'typescript' => '/("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`)|\b(?:const|let|var|function|return|if|else|for|while|switch|case|break|continue|import|from|export|default|new|class|extends|async|await|try|catch|finally|throw|typeof)\b|\b(?:true|false|null|undefined)\b|\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b/',
            'php' => '/(<\?php)|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|`(?:\\\\.|[^`\\\\])*`)|\b(?:echo|function|return|if|else|elseif|foreach|for|while|public|protected|private|class|trait|interface|enum|match|new|use|namespace|extends|implements|static|fn)\b|\$\w+|\b(?:true|false|null)\b|\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b/',
            'python' => '/("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|"""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\')|\b(?:def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|with|lambda|yield|pass|break|continue|async|await)\b|\b(?:True|False|None)\b|\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b/',
            'lua' => '/("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|\[\[[\s\S]*?\]\])|\b(?:function|local|return|if|then|elseif|else|for|while|repeat|until|end|do|in)\b|\b(?:true|false|nil)\b|\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b/',
            'yaml' => '/^(\s*[\w-]+:)|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\'|\b-?(?:0|[1-9]\d*)(?:\.\d+)?\b|\b(?:true|false|null)\b)/',
            'xml', 'html' => '/(<\/?[\w:-]+(?:\s+[\w:-]+(?:=(?:"[^"]*"|\'[^\']*\'))?)*\s*\/?>)|("(?:\\\\.|[^"\\\\])*"|\'(?:\\\\.|[^\'\\\\])*\')/',
            default => null,
        };

        return $this->buildTokens($line, $syntax, $pattern);
    }

    /**
     * @return array<int, array{content: string, type: string}>
     */
    protected function buildTokens(string $line, string $syntax, ?string $pattern): array
    {
        $commentPrefix = match ($syntax) {
            'php', 'javascript', 'typescript' => '//',
            'python', 'yaml' => '#',
            'lua' => '--',
            default => null,
        };

        if ($commentPrefix !== null) {
            $commentPosition = strpos($line, $commentPrefix);

            if ($commentPosition !== false) {
                $beforeComment = substr($line, 0, $commentPosition);
                $comment = substr($line, $commentPosition);

                return [
                    ...$this->tokenizeCode($beforeComment, $pattern),
                    [
                        'content' => $comment,
                        'type' => 'comment',
                    ],
                ];
            }
        }

        return $this->tokenizeCode($line, $pattern);
    }

    /**
     * @return array<int, array{content: string, type: string}>
     */
    protected function tokenizeCode(string $line, ?string $pattern): array
    {
        if ($line === '' || $pattern === null) {
            return [
                [
                    'content' => $line,
                    'type' => 'plain',
                ],
            ];
        }

        preg_match_all($pattern, $line, $matches, PREG_OFFSET_CAPTURE);

        if ($matches[0] === []) {
            return [
                [
                    'content' => $line,
                    'type' => 'plain',
                ],
            ];
        }

        $tokens = [];
        $cursor = 0;

        foreach ($matches[0] as [$value, $offset]) {
            if ($offset > $cursor) {
                $tokens[] = [
                    'content' => substr($line, $cursor, $offset - $cursor),
                    'type' => 'plain',
                ];
            }

            $tokens[] = [
                'content' => $value,
                'type' => $this->resolveTokenType($value),
            ];

            $cursor = $offset + strlen($value);
        }

        if ($cursor < strlen($line)) {
            $tokens[] = [
                'content' => substr($line, $cursor),
                'type' => 'plain',
            ];
        }

        return $tokens;
    }

    protected function resolveTokenType(string $value): string
    {
        if (preg_match('/^["\'`]/', $value) === 1 || str_starts_with($value, '"""') || str_starts_with($value, "'''")) {
            return 'string';
        }

        if (preg_match('/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/', $value) === 1) {
            return 'number';
        }

        if (preg_match('/^(true|false|null|undefined|True|False|None|nil)$/', $value) === 1) {
            return 'literal';
        }

        if (str_starts_with($value, '$')) {
            return 'variable';
        }

        if ($value === '<?php') {
            return 'keyword';
        }

        if (str_starts_with($value, '<')) {
            return 'tag';
        }

        if (str_ends_with($value, ':') && preg_match('/^[\s\w-]+:$/', $value) === 1) {
            return 'property';
        }

        return 'keyword';
    }
}
