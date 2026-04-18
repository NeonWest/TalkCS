package com.talkcs.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Data
@Builder
@Entity
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "site_config")
public class SiteConfig {
    @Id
    private Long id;

    @Builder.Default
    private String siteName = "TalkCS";

    @Builder.Default
    private String siteTagline = "University Forum Platform";

    @Builder.Default
    private String primaryColor = "#f97316";

    private String logoUrl;
}
