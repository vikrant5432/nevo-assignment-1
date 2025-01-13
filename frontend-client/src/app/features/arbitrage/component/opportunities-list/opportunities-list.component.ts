import { Component, OnDestroy, OnInit } from '@angular/core';
import { interval, Subscription, switchMap } from 'rxjs';
import { ArbitrageOpportunity } from '../../model/arbitrage.model';
import { ArbitrageApiService } from '../../service/arbitrage-mock.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-opportunities-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './opportunities-list.component.html',
  styleUrls: ['./opportunities-list.component.css'],
})
export class OpportunitiesListComponent implements OnInit, OnDestroy {
  opportunities: ArbitrageOpportunity[] = [];
  loading = true;
  error: string | null = null;
  lastScanTime: Date = new Date();
  nextScanCountdown = 10;
  private subscription: Subscription | null = null;
  private countdownSubscription: Subscription | null = null;

  constructor(private arbitrageService: ArbitrageApiService) {}

  ngOnInit(): void {
    this.startPolling();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.countdownSubscription?.unsubscribe();
  }

  private startPolling(): void {
    // Initial load
    this.loadOpportunities();

    // Poll every 10 seconds
    this.subscription = interval(10000)
      .pipe(switchMap(() => this.arbitrageService.getOpportunities()))
      .subscribe({
        next: (data) => {
          this.opportunities = data;
          this.loading = false;
          this.error = null;
          this.lastScanTime = new Date();
          this.nextScanCountdown = 10;
        },
        error: (err) => {
          this.error = 'Failed to load opportunities';
          this.loading = false;
          console.error('Error loading opportunities:', err);
        },
      });
  }

  private startCountdown(): void {
    this.countdownSubscription = interval(1000).subscribe(() => {
      if (this.nextScanCountdown > 0) {
        this.nextScanCountdown--;
      }
    });
  }

  loadOpportunities(): void {
    this.loading = true;
    this.error = null;
    this.arbitrageService.getOpportunities().subscribe({
      next: (data) => {
        this.opportunities = data;
        this.loading = false;
        this.error = null;
        this.lastScanTime = new Date();
        this.nextScanCountdown = 10;
      },
      error: (err) => {
        this.error = 'Failed to load opportunities';
        this.loading = false;
        console.error('Error loading opportunities:', err);
      },
    });
  }
}
