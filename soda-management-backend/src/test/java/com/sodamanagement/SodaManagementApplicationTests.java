package com.sodamanagement;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@TestPropertySource(properties = {
        "soda.data-file=${java.io.tmpdir}/soda-test-state.json"
})
class SodaManagementApplicationTests {

    @Test
    void contextLoads() {
    }
}
