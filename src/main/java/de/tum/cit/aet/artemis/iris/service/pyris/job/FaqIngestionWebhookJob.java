package de.tum.cit.aet.artemis.iris.service.pyris.job;

import de.tum.cit.aet.artemis.core.domain.Course;
import de.tum.cit.aet.artemis.exercise.domain.Exercise;

/**
 * An implementation of a PyrisJob for Faq Ingestion in Pyris.
 * This job is used to reference the details of then Ingestion when Pyris sends a status update.
 */
public record FaqIngestionWebhookJob(String jobId, long courseId, long faqId) implements PyrisJob {

    @Override
    public boolean canAccess(Course course) {
        return false;
    }

    @Override
    public boolean canAccess(Exercise exercise) {
        return false;
    }
}
