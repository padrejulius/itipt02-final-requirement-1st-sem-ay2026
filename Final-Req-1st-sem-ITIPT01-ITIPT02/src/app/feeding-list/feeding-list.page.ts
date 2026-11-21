import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonBadge, IonSearchbar } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, nutritionOutline, callOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-feeding-list',
  templateUrl: './feeding-list.page.html',
  styleUrls: ['./feeding-list.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, HttpClientModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonList, IonItem, IonBadge, IonSearchbar ]})

export class FeedingListPage implements OnInit {
  feedingList = signal<any[]>([]);
  searchTerm = signal<string>('');

  filteredFeedingList = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.feedingList();

    if (!term) {
      return list;
    }

    return list.filter((child: any) => {
      const matchesName = String(child.fullName).toLowerCase().includes(term);
      const matchesPurok = String(child.purok).toLowerCase().includes(term);
      return matchesName || matchesPurok;
    });
  });

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'nutrition-outline': nutritionOutline,
      'call-outline': callOutline,
      'person-outline': personOutline
    });
  }

  ngOnInit() {
    this.fetchFeedingList();
  }

  fetchFeedingList() {
    this.http.get<any>('http://localhost:8000/api/children').subscribe({
      next: (res) => {
        console.log('API Response Data:', res);

        if (res && res.success && res.data) {
          const mapped = res.data
            .filter((child: any) => {
              const status = child.nutritional_status ? child.nutritional_status.trim().toLowerCase() : '';
              return status.includes('underweight');
            })
            .map((child: any) => ({
              fullName: child.name,
              ageMonths: child.age,
              purok: child.purok,
              weightKg: child.weight,
              heightCm: child.height,
              nutritionalStatus: child.nutritional_status,
              overallStatus: child.overall_status ? child.overall_status.trim().toLowerCase() : '',
              parentName: child.guardian,
              contactNumber: child.contact
            }));

          this.feedingList.set(mapped);
          console.log('Filtered Feeding List:', mapped);

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching feeding list:', err);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-home']);
  }
}