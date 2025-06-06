package de.tum.cit.aet.artemis.core;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.test.context.support.WithMockUser;

import de.tum.cit.aet.artemis.core.dto.vm.LoggerVM;
import de.tum.cit.aet.artemis.shared.base.AbstractSpringIntegrationIndependentTest;

class LogResourceIntegrationTest extends AbstractSpringIntegrationIndependentTest {

    @Test
    @WithMockUser(roles = "ADMIN")
    void testGetList() throws Exception {
        request.get("/api/core/admin/logs", HttpStatus.OK, List.class);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void testChangeLevel() throws Exception {
        LoggerVM logger = new LoggerVM();
        logger.setLevel("DEBUG");
        logger.setName("logger");
        LoggerVM response = request.putWithResponseBody("/api/core/admin/logs", logger, LoggerVM.class, HttpStatus.OK);
        assertThat(response).isEqualTo(logger);
    }
}
