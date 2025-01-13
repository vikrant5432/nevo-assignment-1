// src/app/features/arbitrage/components/opportunities-list/opportunities-list.component.spec.ts
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  discardPeriodicTasks,
} from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { OpportunitiesListComponent } from './opportunities-list.component';
import { ArbitrageApiService } from '../../service/arbitrage-mock.service';
import { ArbitrageOpportunity } from '../../model/arbitrage.model';
import { of, throwError } from 'rxjs';

describe('OpportunitiesListComponent', () => {
  let component: OpportunitiesListComponent;
  let fixture: ComponentFixture<OpportunitiesListComponent>;
  let arbitrageServiceSpy: jasmine.SpyObj<ArbitrageApiService>;
  let httpTestingController: HttpTestingController;

  const mockOpportunities: ArbitrageOpportunity[] = [
    {
      symbol: 'BTC',
      binancePrice: 45000.5,
      solanaPrice: 45100.75,
      priceSpread: 100.25,
      profitPercentage: 0.22,
      profitAmount: 89.75,
      direction: 'binanceToSolana' as const,
      fees: {
        binance: 45,
        solana: 20,
      },
      tradingVolume: 100,
      slippage: 0.01,
      timestamp: Date.now(),
    },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ArbitrageApiService', [
      'getOpportunities',
    ]);
    spy.getOpportunities.and.returnValue(of(mockOpportunities));

    await TestBed.configureTestingModule({
      imports: [OpportunitiesListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ArbitrageApiService, useValue: spy },
      ],
    }).compileComponents();

    arbitrageServiceSpy = TestBed.inject(
      ArbitrageApiService
    ) as jasmine.SpyObj<ArbitrageApiService>;
    httpTestingController = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(OpportunitiesListComponent);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load opportunities on init', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(arbitrageServiceSpy.getOpportunities).toHaveBeenCalled();
    expect(component.opportunities).toEqual(mockOpportunities);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();

    discardPeriodicTasks(); // Clean up interval
  }));

  it('should handle error when loading opportunities', fakeAsync(() => {
    arbitrageServiceSpy.getOpportunities.and.returnValue(
      throwError(() => new Error('Test error'))
    );

    component.ngOnInit();
    tick();

    expect(component.error).toBe('Failed to load opportunities');
    expect(component.loading).toBeFalse();

    discardPeriodicTasks(); // Clean up interval
  }));

  it('should show opportunities when data exists', fakeAsync(() => {
    component.loading = false;
    component.opportunities = mockOpportunities;
    fixture.detectChanges();

    const opportunitiesElement = fixture.nativeElement.querySelector(
      '.opportunities-list'
    );
    expect(opportunitiesElement).toBeTruthy();

    discardPeriodicTasks(); // Clean up interval
  }));

  it('should clean up subscriptions on destroy', fakeAsync(() => {
    component.ngOnInit();
    tick();

    expect(component['subscription']).toBeTruthy();
    expect(component['countdownSubscription']).toBeTruthy();

    const subscriptionSpy = spyOn(component['subscription']!, 'unsubscribe');
    const countdownSpy = spyOn(
      component['countdownSubscription']!,
      'unsubscribe'
    );

    component.ngOnDestroy();

    expect(subscriptionSpy).toHaveBeenCalled();
    expect(countdownSpy).toHaveBeenCalled();

    discardPeriodicTasks();
  }));
});
