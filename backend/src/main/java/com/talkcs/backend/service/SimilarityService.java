package com.talkcs.backend.service;

import com.talkcs.backend.dto.SimilarPostResponse;
import com.talkcs.backend.model.Post;
import com.talkcs.backend.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.*;

@Service
@RequiredArgsConstructor
public class SimilarityService {

    private final PostRepository postRepository;

    // BM25 tuning parameters
    private static final double K1 = 1.5;
    private static final double B  = 0.75;

    // Ensemble weights (must sum to 1.0)
    private static final double W_BM25  = 0.5;
    private static final double W_TITLE = 0.3;
    private static final double W_TAGS  = 0.2;

    private static final double MIN_SCORE = 0.08;
    private static final int    TOP_N     = 3;

    private static final Set<String> STOP_WORDS = Set.of(
        "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
        "not","with","this","that","are","was","be","as","by","from","has","have",
        "had","do","does","did","can","could","will","would","should","my","your",
        "we","i","you","he","she","they","what","how","why","when","where","which"
    );

    public List<SimilarPostResponse> findSimilar(String queryTitle, String queryBody,
                                                  Long categoryId, List<String> queryTags) {
        List<Post> corpus = postRepository.findByCategoryId(categoryId);
        if (corpus.isEmpty()) return List.of();

        List<String> queryTokens = tokenize((queryTitle == null ? "" : queryTitle)
                                          + " " + (queryBody == null ? "" : queryBody));
        List<String> titleTokens = tokenize(queryTitle == null ? "" : queryTitle);
        Set<String> tagSet = queryTags == null ? Set.of() : new HashSet<>(queryTags);

        // --- BM25 corpus stats ---
        int N = corpus.size();
        double avgdl = corpus.stream()
            .mapToInt(p -> tokenize(p.getBody()).size()).average().orElse(1.0);

        // df per term across corpus bodies
        Map<String, Integer> df = new HashMap<>();
        for (Post p : corpus) {
            Set<String> unique = new HashSet<>(tokenize(p.getBody()));
            for (String t : unique) df.merge(t, 1, Integer::sum);
        }

        // --- Score each post ---
        List<double[]> rawScores = new ArrayList<>(); // [bm25, jaccard_title, tag_overlap]
        for (Post p : corpus) {
            List<String> docTokens = tokenize(p.getBody());
            rawScores.add(new double[]{
                bm25(queryTokens, docTokens, df, N, avgdl),
                jaccard(titleTokens, tokenize(p.getTitle())),
                tagOverlap(tagSet, p.getTags().stream().map(t -> t.getName()).collect(Collectors.toSet()))
            });
        }

        // Normalize BM25 to [0,1]
        double maxBM25 = rawScores.stream().mapToDouble(s -> s[0]).max().orElse(1.0);
        if (maxBM25 == 0) maxBM25 = 1.0;

        // Compute ensemble scores
        List<double[]> scored = new ArrayList<>(); // [postIndex, finalScore]
        for (int i = 0; i < corpus.size(); i++) {
            double[] s = rawScores.get(i);
            double finalScore = W_BM25 * (s[0] / maxBM25) + W_TITLE * s[1] + W_TAGS * s[2];
            scored.add(new double[]{i, finalScore});
        }

        return scored.stream()
            .filter(s -> s[1] >= MIN_SCORE)
            .sorted((a, b) -> Double.compare(b[1], a[1]))
            .limit(TOP_N)
            .map(s -> {
                Post p = corpus.get((int) s[0]);
                return SimilarPostResponse.builder()
                    .id(p.getId()).title(p.getTitle())
                    .score(Math.round(s[1] * 1000.0) / 1000.0)
                    .build();
            })
            .collect(Collectors.toList());
    }

    private double bm25(List<String> query, List<String> doc,
                         Map<String, Integer> df, int N, double avgdl) {
        Map<String, Long> tf = doc.stream().collect(Collectors.groupingBy(t -> t, Collectors.counting()));
        double docLen = doc.size();
        double score = 0.0;
        for (String term : new HashSet<>(query)) {
            int dft = df.getOrDefault(term, 0);
            if (dft == 0) continue;
            double idf = Math.log((N - dft + 0.5) / (dft + 0.5) + 1);
            double termTf = tf.getOrDefault(term, 0L);
            double tfNorm = termTf * (K1 + 1) / (termTf + K1 * (1 - B + B * docLen / avgdl));
            score += idf * tfNorm;
        }
        return score;
    }

    private double jaccard(List<String> a, List<String> b) {
        if (a.isEmpty() && b.isEmpty()) return 0.0;
        Set<String> sa = new HashSet<>(a), sb = new HashSet<>(b);
        Set<String> intersection = new HashSet<>(sa); intersection.retainAll(sb);
        Set<String> union = new HashSet<>(sa); union.addAll(sb);
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private double tagOverlap(Set<String> queryTags, Set<String> postTags) {
        if (queryTags.isEmpty() || postTags.isEmpty()) return 0.0;
        Set<String> intersection = new HashSet<>(queryTags); intersection.retainAll(postTags);
        Set<String> union = new HashSet<>(queryTags); union.addAll(postTags);
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private List<String> tokenize(String text) {
        if (text == null || text.isBlank()) return List.of();
        return Arrays.stream(text.toLowerCase().split("[^a-z0-9#+]+"))
            .filter(t -> t.length() > 2 && !STOP_WORDS.contains(t))
            .collect(Collectors.toList());
    }
}
