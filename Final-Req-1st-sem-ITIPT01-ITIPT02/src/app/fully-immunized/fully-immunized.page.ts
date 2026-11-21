import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonBadge} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowBackOutline, shieldCheckmarkOutline } from 'ionicons/icons';

interface ImmunizedChild {
  id: number;
  fullName: string;
  ageMonths: number;
  purok: string;
  lastVaccine?: string;
  dateCompleted?: string;
}

@Component({
  selector: 'app-fully-immunized',
  templateUrl: './fully-immunized.page.html',
  styleUrls: ['./fully-immunized.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonSearchbar, IonList, IonItem, IonBadge ] })

export class FullyImmunizedPage implements OnInit {
  searchTerm = signal<string>('');
  immunizedList = signal<ImmunizedChild[]>([]);

  filteredImmunizedList = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.immunizedList();
    if (!term) {
      return list;
    }
    return list.filter(child =>
      child.fullName.toLowerCase().includes(term) ||
      child.purok.toLowerCase().includes(term)
    );
  });

  constructor(private router: Router, private cdr: ChangeDetectorRef) {
    addIcons({
      'arrow-back-outline': arrowBackOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.fetchFullyImmunizedChildren();
  }

  fetchFullyImmunizedChildren() {
    fetch('http://localhost:8000/api/children/fully-immunized')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          const mapped = response.data.map((child: any) => ({
            id: child.id,
            fullName: child.name,
            ageMonths: child.age,
            purok: child.purok,
            lastVaccine: 'Complete',
            dateCompleted: 'Verified'
          }));
          this.immunizedList.set(mapped);
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error fetching fully immunized children:', err));
  }

  viewChildVaccineRecord(child: ImmunizedChild): void {
    this.router.navigate(['/vaccine'], {
      state: { childId: child.id, isViewOnly: true }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin-home']);
  }
}