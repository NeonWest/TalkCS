package com.talkcs.backend.testsupport;

import org.hibernate.dialect.H2Dialect;

/**
 * Test-only dialect that suppresses enum check-constraint generation.
 * H2 (even in PostgreSQL MODE) rejects the standard
 *   check ((col in ('A','B','C')))
 * syntax Hibernate emits, producing 23514 on otherwise valid inserts.
 * Returning null from getCheckCondition makes Hibernate skip the constraint
 * in test-generated DDL. Production schema is unaffected.
 */
public class TestH2Dialect extends H2Dialect {

    @Override
    public String getCheckCondition(String columnName, String[] values) {
        return null;
    }

    @Override
    public String getCheckCondition(String columnName, long[] values) {
        return null;
    }
}
