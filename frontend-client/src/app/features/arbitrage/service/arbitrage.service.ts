import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArbitrageOpportunity } from '../model/arbitrage.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ArbitrageApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getOpportunities(): Observable<ArbitrageOpportunity[]> {
    return this.http.get<ArbitrageOpportunity[]>(
      `${this.baseUrl}/opportunities`
    );
  }
}
