package com.talkcs.backend.service;

import com.talkcs.backend.dto.SearchResponse;
import com.talkcs.backend.model.Category;
import com.talkcs.backend.model.Post;
import com.talkcs.backend.model.User;
import com.talkcs.backend.repository.*;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SearchServiceTests {

    @Mock private PostRepository postRepository;
    @Mock private CategoryRepository categoryRepository;
    @Mock private UserRepository userRepository;
    @Mock private CommentRepository commentRepository;
    @Mock private VoteRepository voteRepository;
    @InjectMocks private SearchService searchService;

    @Test
    void search_combinesPostsCategoriesUsers() {
        User u = User.builder().id(1L).username("alice").build();
        Category c = Category.builder().id(1L).name("Java").build();
        Post p = Post.builder().id(1L).title("Java tips").body("good").author(u).category(c).build();

        when(postRepository.findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCase("java", "java"))
            .thenReturn(List.of(p));
        when(categoryRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase("java", "java"))
            .thenReturn(List.of(c));
        when(userRepository.findByUsernameContainingIgnoreCase("java"))
            .thenReturn(List.of(u));
        when(commentRepository.countByPostId(anyLong())).thenReturn(0);
        when(voteRepository.countByPostIdAndValue(anyLong(), anyInt())).thenReturn(0);
        when(postRepository.countByAuthorId(anyLong())).thenReturn(0L);
        when(commentRepository.countByAuthorId(anyLong())).thenReturn(0L);

        SearchResponse r = searchService.search("java");
        assertThat(r.getPosts()).hasSize(1);
        assertThat(r.getCategories()).hasSize(1);
        assertThat(r.getUsers()).hasSize(1);
    }

    @Test
    void search_returnsEmptyResults() {
        when(postRepository.findByTitleContainingIgnoreCaseOrBodyContainingIgnoreCase(any(), any())).thenReturn(List.of());
        when(categoryRepository.findByNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(any(), any())).thenReturn(List.of());
        when(userRepository.findByUsernameContainingIgnoreCase(any())).thenReturn(List.of());

        SearchResponse r = searchService.search("nothing");
        assertThat(r.getPosts()).isEmpty();
        assertThat(r.getCategories()).isEmpty();
        assertThat(r.getUsers()).isEmpty();
    }
}
