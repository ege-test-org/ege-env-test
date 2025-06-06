import { HttpClient } from '@angular/common/http';
import { WebsocketService } from 'app/shared/service/websocket.service';
import { inject } from '@angular/core';
import { DomainDependentService } from 'app/programming/shared/code-editor/service/code-editor-domain-dependent.service';
import { DomainChange, DomainType } from 'app/programming/shared/code-editor/model/code-editor.model';

/**
 * Service that can be extended to update rest endpoint urls with the received domain information.
 */
export abstract class DomainDependentEndpointService extends DomainDependentService {
    protected restResourceUrl?: string;
    protected http = inject(HttpClient);
    protected websocketService = inject(WebsocketService);

    protected constructor() {
        super();
        this.initDomainSubscription();
    }

    /**
     * Sets resourceUrls according to the parameter.
     * @param domain - enum that defines the type of the domain.
     */
    setDomain(domain: DomainChange) {
        super.setDomain(domain);
        this.restResourceUrl = this.calculateRestResourceURL(domain);
    }

    calculateRestResourceURL(domain: DomainChange): string | undefined {
        const [domainType, domainValue] = domain;
        switch (domainType) {
            case DomainType.PARTICIPATION:
                return `api/programming/repository/${domainValue.id}`;
            case DomainType.TEST_REPOSITORY:
                return `api/programming/test-repository/${domainValue.id}`;
            case DomainType.AUXILIARY_REPOSITORY:
                return `api/programming/auxiliary-repository/${domainValue.id}`;
        }
    }
}
