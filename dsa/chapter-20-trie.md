# 20: Trie

**Goal:** Teach learners how tries store strings by shared prefixes, how to implement insert, search, prefix lookup, and deletion in Java, and when a trie is better than scanning a dictionary.
**Outcome:** By the end of this chapter, you can design trie nodes, implement insert and search operations, support prefix queries, reason about deletion and memory trade-offs, and solve dictionary and autocomplete-style problems using tries.

---

## 1. Intuition First

Tries matter because some string problems are not really about whole-word equality. They are about shared prefixes. If many words begin the same way, a trie stores that common path once instead of repeating it in every comparison.

A simple real-world analogy is a folder tree for words. All words starting with `app` share the same first three folders before branching into `apple`, `apply`, or `application`.

The core mental model is this: each edge represents one character, and walking from the root to a marked node spells a word. Prefixes correspond to paths, so prefix lookup becomes a path-existence question.

The most common beginner confusion point is thinking trie nodes store whole words. Most trie nodes store only the next-character links plus a flag marking whether the path up to that node completes a word.

In the roadmap, this chapter closes the early ordered-structure section by moving from numeric order and heap priority to string prefix structure.

## 2. Core Concepts and Techniques

### Concept Cluster: Trie Structure, Node Design, Insert, Search, and Prefix Search
Key concepts in this block:
- 20.1 Trie structure and node design
- 20.2 Insert and search operations
- 20.3 Prefix search

#### Intuition

A trie groups words by shared starting characters.

#### Why It Matters

Exact search and prefix search become proportional to the word length rather than the number of stored words.

#### How It Works

- start at the root
- for each character, move to the matching child node, creating it if insertion requires
- after the last character, mark the node as a complete word
- exact search succeeds only if the full path exists and the last node is marked as a word
- prefix search succeeds if the full prefix path exists, even if the last node is not a complete word

#### Java Implementation Notes

- For lowercase English letters, `TrieNode[] children = new TrieNode[26]` is simple and fast.
- For larger alphabets or sparse branching, a `Map<Character, TrieNode>` may save memory at the cost of some overhead.
- Keep exact-word and prefix logic separate through an `isWord` flag.

#### Common Mistakes

- treating a prefix path as proof of a full stored word
- forgetting to mark the end of a word
- using whole-word strings at each node and losing the point of the structure

#### Quick Example

```java
class TrieQuickExample {
    static final class TrieNode {
        TrieNode[] children = new TrieNode[26];
        boolean isWord;
    }

    static final class Trie {
        private final TrieNode root = new TrieNode();

        void insert(String word) {
            TrieNode current = root;
            for (int index = 0; index < word.length(); index++) {
                int childIndex = word.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    current.children[childIndex] = new TrieNode();
                }
                current = current.children[childIndex];
            }
            current.isWord = true;
        }
    }
}
```

#### Debugging Tip

When a search unexpectedly fails, trace the path character by character and check whether the issue is a missing child or a missing `isWord` mark.

#### Advanced Note

Trie performance depends on word length, not dictionary size, which is why it can outperform repeated full-word scans for heavy prefix workloads.

### Concept Cluster: Delete and Memory Considerations
Key concepts in this block:
- 20.4 Delete and memory considerations

#### Intuition

Deleting from a trie is not just unmarking a word. You may also want to prune nodes that are no longer needed by any other word.

#### Why It Matters

Tries trade memory for fast prefix operations, so understanding when nodes can be reclaimed matters.

#### How It Works

- find the word path recursively or iteratively
- unmark the final node's `isWord` flag
- remove child references only if the child subtree no longer represents any other word
- shared prefix nodes must remain if another word still depends on them

#### Java Implementation Notes

- Recursive delete is often the clearest because it can decide on pruning while returning upward.
- Arrays are faster but can waste memory on sparse alphabets.
- Maps reduce wasted space when branching is sparse but add object overhead and hashing costs.

#### Common Mistakes

- deleting shared prefix nodes too aggressively
- unmarking the wrong node
- forgetting that removing a word should not remove a longer word with the same prefix

#### Quick Example

```java
class TrieDeleteQuickNotes {
    static boolean hasChildren(TrieQuickExample.TrieNode node) {
        for (TrieQuickExample.TrieNode child : node.children) {
            if (child != null) {
                return true;
            }
        }
        return false;
    }
}
```

#### Debugging Tip

When debugging delete, test pairs like `app` and `apple`. Those cases expose shared-prefix pruning mistakes immediately.

#### Advanced Note

Memory optimization becomes more important with large dictionaries or wide alphabets, where compressed trie variants may later become relevant.

### Concept Cluster: Dictionary and Autocomplete Problems
Key concepts in this block:
- 20.5 Dictionary and autocomplete problems

#### Intuition

A trie is a natural dictionary where you can stop at a prefix node and explore all completions below it.

#### Why It Matters

Autocomplete, spell-prefix matching, and dictionary lookup are the most recognizable trie applications.

#### How It Works

- insert all dictionary words
- walk the prefix path
- if the prefix exists, DFS from that node to collect completions
- exact-word dictionary checks only need path lookup plus `isWord`

#### Java Implementation Notes

- DFS from the prefix node can build suggestions into a list.
- Add limits when only the first few suggestions are needed.
- Sorting requirements for autocomplete depend on the problem statement, not on the trie itself.

#### Common Mistakes

- scanning all dictionary words even after building a trie
- forgetting to include the prefix node itself when it marks a full word
- not stopping DFS when a suggestion limit has already been reached

#### Quick Example

```java
import java.util.ArrayList;
import java.util.List;

class AutocompleteQuickExample {
    static void collectWords(TrieQuickExample.TrieNode node, StringBuilder path, List<String> result) {
        if (node.isWord) {
            result.add(path.toString());
        }

        for (int childIndex = 0; childIndex < 26; childIndex++) {
            TrieQuickExample.TrieNode child = node.children[childIndex];
            if (child != null) {
                path.append((char) ('a' + childIndex));
                collectWords(child, path, result);
                path.deleteCharAt(path.length() - 1);
            }
        }
    }
}
```

#### Debugging Tip

If autocomplete returns wrong words, separate prefix navigation from suffix collection and test them independently.

#### Advanced Note

Autocomplete quality in real systems also depends on ranking, not just prefix matching, but trie structure is still a common retrieval backbone.

## 3. Worked Examples and Full Solutions

### Worked Example 1: Implement Trie with Insert, Search, and startsWith
#### Problem Statement

Design a trie that supports `insert`, `search`, and `startsWith` for lowercase English words.

#### Why This Example Matters

It covers the core trie contract and establishes the difference between full-word and prefix queries.

#### Constraints or Assumptions

- words contain only lowercase English letters
- empty string behavior should be defined consistently
- exact search and prefix search are different operations

#### Brute-Force Approach

Store all words in a list. For `search`, scan for exact equality. For `startsWith`, scan all words until one matches the prefix.

#### Better Approach

Use a trie with one node per prefix state.

#### Why the Better Approach Works

All words sharing the same prefix reuse the same path. Both exact search and prefix search become path-walk operations proportional to the query length.

#### Pragmatic Java Choice

Use a fixed array of size `26` in each node because the alphabet is known and small.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class TrieBasicsExample {
    static final class NaiveDictionary {
        private final List<String> words = new ArrayList<>();

        void insert(String word) {
            words.add(word);
        }

        boolean search(String target) {
            for (String word : words) {
                if (word.equals(target)) {
                    return true;
                }
            }
            return false;
        }

        boolean startsWith(String prefix) {
            for (String word : words) {
                if (word.startsWith(prefix)) {
                    return true;
                }
            }
            return false;
        }
    }

    static final class Trie {
        static final class TrieNode {
            TrieNode[] children = new TrieNode[26];
            boolean isWord;
        }

        private final TrieNode root = new TrieNode();

        void insert(String word) {
            TrieNode current = root;
            for (int index = 0; index < word.length(); index++) {
                int childIndex = word.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    current.children[childIndex] = new TrieNode();
                }
                current = current.children[childIndex];
            }
            current.isWord = true;
        }

        boolean search(String word) {
            TrieNode node = findNode(word);
            return node != null && node.isWord;
        }

        boolean startsWith(String prefix) {
            return findNode(prefix) != null;
        }

        private TrieNode findNode(String text) {
            TrieNode current = root;
            for (int index = 0; index < text.length(); index++) {
                int childIndex = text.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    return null;
                }
                current = current.children[childIndex];
            }
            return current;
        }
    }
}
```

#### Dry Run

Insert `app` and `apple`.

- root gets child `a`
- `a` gets child `p`
- first `p` gets second `p`
- mark the second `p` node as a full word for `app`
- continue to create `l` and `e` for `apple`

Now:
- `search("app")` is true because the node is marked as a word
- `startsWith("app")` is also true
- `search("appl")` is false because the path exists but the node is not marked as a full word

#### Time and Space Complexity

- Brute force: `search` and `startsWith` can take `O(number of words * word length)` in the worst case
- Better approach: `O(length of word or prefix)` time per query, space proportional to total created trie nodes

#### Edge Cases

- searching for a word never inserted
- prefix exists but full word does not
- inserting the same word multiple times under the same rules

#### Common Mistakes

- forgetting the `isWord` flag
- returning true for exact search when only the prefix exists
- not defining the allowed alphabet clearly

### Worked Example 2: Autocomplete Suggestions for a Prefix
#### Problem Statement

Given a dictionary of lowercase words and a prefix, return all dictionary words that start with that prefix.

#### Why This Example Matters

It shows the trie's main real-world strength: once you reach the prefix node, the remaining work is limited to matching completions.

#### Constraints or Assumptions

- words are lowercase English letters
- suggestion order may be lexicographic if children are explored from `a` to `z`
- return an empty list if the prefix is absent

#### Brute-Force Approach

Scan every word in the dictionary and keep only those that start with the prefix.

#### Better Approach

Walk the prefix in the trie, then DFS from the prefix node to collect completions.

#### Why the Better Approach Works

The trie avoids inspecting unrelated words because only the subtree under the prefix node can produce valid suggestions.

#### Pragmatic Java Choice

Use DFS with a mutable `StringBuilder` so suffix construction stays efficient.

#### Java Solution

```java
import java.util.ArrayList;
import java.util.List;

class AutocompleteExample {
    static List<String> autocompleteNaive(List<String> dictionary, String prefix) {
        List<String> result = new ArrayList<>();
        for (String word : dictionary) {
            if (word.startsWith(prefix)) {
                result.add(word);
            }
        }
        return result;
    }

    static final class Trie {
        static final class TrieNode {
            TrieNode[] children = new TrieNode[26];
            boolean isWord;
        }

        private final TrieNode root = new TrieNode();

        void insert(String word) {
            TrieNode current = root;
            for (int index = 0; index < word.length(); index++) {
                int childIndex = word.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    current.children[childIndex] = new TrieNode();
                }
                current = current.children[childIndex];
            }
            current.isWord = true;
        }

        List<String> autocomplete(String prefix) {
            TrieNode start = findNode(prefix);
            List<String> result = new ArrayList<>();
            if (start == null) {
                return result;
            }
            collect(start, new StringBuilder(prefix), result);
            return result;
        }

        private TrieNode findNode(String text) {
            TrieNode current = root;
            for (int index = 0; index < text.length(); index++) {
                int childIndex = text.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    return null;
                }
                current = current.children[childIndex];
            }
            return current;
        }

        private void collect(TrieNode node, StringBuilder path, List<String> result) {
            if (node.isWord) {
                result.add(path.toString());
            }

            for (int childIndex = 0; childIndex < 26; childIndex++) {
                TrieNode child = node.children[childIndex];
                if (child != null) {
                    path.append((char) ('a' + childIndex));
                    collect(child, path, result);
                    path.deleteCharAt(path.length() - 1);
                }
            }
        }
    }
}
```

#### Dry Run

Dictionary: `app`, `apple`, `apply`, `bat`, `batch`. Prefix: `app`.

- walk `a -> p -> p`
- reach the prefix node for `app`
- DFS from that node
- include `app` because the prefix node is a complete word
- continue to `apple` and `apply`
- words under `bat` are never explored

#### Time and Space Complexity

- Brute force: `O(number of words * prefix length)` plus result construction
- Better approach: `O(prefix length + total size of returned suffix subtree)` time, plus output space

#### Edge Cases

- missing prefix returns empty list
- prefix itself may already be a full word
- very large suggestion sets may need an output limit in real systems

#### Common Mistakes

- forgetting to include the prefix when it is also a valid word
- scanning the full dictionary even after building the trie
- mutating the path without undoing the last character after DFS returns

### Worked Example 3: Delete a Word from a Trie Safely
#### Problem Statement

Given a trie and a word, delete the word while preserving all other stored words.

#### Why This Example Matters

It exposes the main structural risk in tries: shared prefixes must survive deletion of one word.

#### Constraints or Assumptions

- words are lowercase English letters
- deleting a missing word should leave the trie unchanged
- unused nodes should be pruned when possible

#### Brute-Force Approach

Store all dictionary words separately, remove the target word from that list, and rebuild the entire trie from scratch.

#### Better Approach

Use recursive deletion that unmarks the target word and prunes nodes only when they no longer represent any word or shared prefix.

#### Why the Better Approach Works

The recursive return tells the parent whether a child subtree has become unnecessary. Shared nodes stay alive because they still have children or still mark another word.

#### Pragmatic Java Choice

Use a recursive helper that returns whether the current node can be deleted from its parent.

#### Java Solution

```java
class TrieDeleteExample {
    static final class Trie {
        static final class TrieNode {
            TrieNode[] children = new TrieNode[26];
            boolean isWord;
        }

        private final TrieNode root = new TrieNode();

        void insert(String word) {
            TrieNode current = root;
            for (int index = 0; index < word.length(); index++) {
                int childIndex = word.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    current.children[childIndex] = new TrieNode();
                }
                current = current.children[childIndex];
            }
            current.isWord = true;
        }

        void delete(String word) {
            delete(root, word, 0);
        }

        boolean search(String word) {
            TrieNode current = root;
            for (int index = 0; index < word.length(); index++) {
                int childIndex = word.charAt(index) - 'a';
                if (current.children[childIndex] == null) {
                    return false;
                }
                current = current.children[childIndex];
            }
            return current.isWord;
        }

        private boolean delete(TrieNode node, String word, int index) {
            if (index == word.length()) {
                if (!node.isWord) {
                    return false;
                }
                node.isWord = false;
                return hasNoChildren(node);
            }

            int childIndex = word.charAt(index) - 'a';
            TrieNode child = node.children[childIndex];
            if (child == null) {
                return false;
            }

            boolean shouldDeleteChild = delete(child, word, index + 1);
            if (shouldDeleteChild) {
                node.children[childIndex] = null;
            }

            return !node.isWord && hasNoChildren(node);
        }

        private boolean hasNoChildren(TrieNode node) {
            for (TrieNode child : node.children) {
                if (child != null) {
                    return false;
                }
            }
            return true;
        }
    }
}
```

#### Dry Run

Insert `app` and `apple`, then delete `app`.

- follow the path `a -> p -> p`
- unmark the `app` node as a full word
- that node still has child `l` for `apple`, so it must not be deleted
- `search("app")` becomes false
- `search("apple")` stays true

#### Time and Space Complexity

- Brute force: rebuilding can cost `O(total dictionary characters)` after each deletion
- Better approach: `O(length of word)` time, `O(length of word)` call stack space

#### Edge Cases

- deleting a missing word
- deleting a word that is also a prefix of another word
- deleting the only stored word

#### Common Mistakes

- pruning shared prefix nodes too early
- unmarking the wrong node
- failing to distinguish exact words from prefixes during delete

## 4. Complexity and Decision Guide

Main runtime and space trade-offs in this chapter:
- trie operations run in time proportional to word or prefix length, which can be much better than scanning many dictionary entries
- tries use more memory than plain lists or sets because every stored character may create nodes and child references
- array-based child storage is fast for fixed alphabets but can waste memory on sparse branching
- delete and autocomplete logic benefit from trie structure but require careful handling of shared prefixes and output size

Choose a trie when:
- prefix queries are frequent
- many words share common prefixes
- query speed by word length matters more than memory cost

Choose a set or list instead when:
- only exact lookup is needed
- the dictionary is small
- memory simplicity matters more than prefix speed

Recognition signals for tries:
- autocomplete
- dictionary prefix matching
- word search with many repeated prefixes

Signals not to force tries:
- no prefix behavior is needed
- the alphabet is huge and sparse while the dataset is small
- a hash-based exact lookup is enough

## 5. Edge Cases, Pitfalls, and Debugging

Most common implementation bugs:
- forgetting the `isWord` marker
- treating prefixes as full words
- deleting shared nodes too aggressively
- miscomputing child indexes from characters

Boundary and memory risks:
- empty string behavior
- unsupported characters outside the chosen alphabet
- large memory use for sparse tries
- autocomplete returning too many results without a limit

Short debugging checklist:
- Does exact search check both the path and `isWord`?
- Does prefix search only need the path?
- During delete, which nodes are shared by other words?
- Is the child index calculation correct for the chosen alphabet?
- Would a map-based node design be more appropriate for this input space?

## 6. Practice Problems

### Easy

- Title: Implement Trie (Prefix Tree)
  - One-line prompt: Support insert, exact search, and prefix search.
  - Expected pattern or core idea: Trie path traversal with `isWord` flags.
- Title: Longest Common Prefix
  - One-line prompt: Find the longest shared prefix among strings.
  - Expected pattern or core idea: Prefix path reasoning or trie construction.
- Title: Design Add and Search Words Data Structure
  - One-line prompt: Support adding words and searching with wildcard dots.
  - Expected pattern or core idea: Trie plus DFS branching.

### Medium

- Title: Search Suggestions System
  - One-line prompt: Return product suggestions for each typed prefix.
  - Expected pattern or core idea: Trie-guided autocomplete.
- Title: Replace Words
  - One-line prompt: Replace sentence words with shortest matching dictionary roots.
  - Expected pattern or core idea: Prefix trie lookup.
- Title: Map Sum Pairs
  - One-line prompt: Support prefix-sum queries on string keys.
  - Expected pattern or core idea: Trie with aggregated values.

### Hard

- Title: Word Search II
  - One-line prompt: Find all dictionary words present in a character board.
  - Expected pattern or core idea: Trie plus DFS backtracking.
- Title: Palindrome Pairs
  - One-line prompt: Find index pairs whose concatenation forms a palindrome.
  - Expected pattern or core idea: Trie or reverse-string prefix reasoning.
- Title: Stream of Characters
  - One-line prompt: Query whether the recent character stream ends with any dictionary word.
  - Expected pattern or core idea: Trie over reversed words.

## 7. Short Recap

The core idea of this chapter is that tries trade memory for fast exact and prefix-based string lookup by storing shared prefixes once.

The most important optimization insight is that after you reach the prefix node, unrelated words disappear from consideration entirely.

The most important implementation warning is to separate full-word logic from prefix logic and to delete only nodes that are truly no longer shared.

This chapter prepares the next chapter by shifting from prefix lookup on strings to range-query structures that organize numeric intervals instead of characters.

## 8. Coverage Check

- [x] 20.1 Trie structure and node design
- [x] 20.2 Insert and search operations
- [x] 20.3 Prefix search
- [x] 20.4 Delete and memory considerations
- [x] 20.5 Dictionary and autocomplete problems

Coverage Summary: 5/5 official subtopics covered
This must always be 5/5 before final output

Next: 21: Segment Tree and Fenwick Tree