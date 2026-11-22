import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonItem, IonSelect, IonSelectOption, IonList, IonLabel, IonIcon, IonBadge, IonButton, IonSearchbar, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { personOutline, checkmarkCircle, timeOutline } from 'ionicons/icons';

interface VaccineRecord {
  vaccineName: string;
  dateGiven?: string;
  completed: boolean;
}

interface ChildProfile {
  id: number;
  name: number | string;
  age: number;
  purok: string;
  overallStatus: string;
  vaccines: VaccineRecord[];
}

@Component({
  selector: 'app-vaccine',
  templateUrl: './vaccine.page.html',
  styleUrls: ['./vaccine.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonCard, IonCardHeader, IonCardSubtitle, IonCardTitle, IonCardContent, IonItem, IonSelect, IonSelectOption, IonList, IonLabel, IonIcon, IonBadge, IonButton, IonSearchbar ] })

export class VaccinePage implements OnInit {
  isViewOnly = signal<boolean>(false);
  headerTitle = signal<string>('Vaccination');

  standardVaccineNames: string[] = [
    'BCG Vaccine',
    'Hepatitis B (Dose 1)',
    'Pentavalent Vaccine (Dose 1)',
    'Oral Polio Vaccine (OPV 1)',
    'Measles, Mumps, Rubella (MMR Dose 1)',
    'Oral Polio Vaccine (Booster)'
  ];

  childrenList = signal<ChildProfile[]>([]);
  searchTerm = signal<string>('');
  currentChild = signal<ChildProfile | null>(null);

  displayedChildren = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.childrenList();
    if (!term) {
      return list;
    }
    return list.filter(child =>
      String(child.name).toLowerCase().includes(term) ||
      String(child.purok).toLowerCase().includes(term)
    );
  });

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {
    addIcons({
      'person-outline': personOutline,
      'checkmark-circle': checkmarkCircle,
      'time-outline': timeOutline
    });
  }

  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    const navState = navigation?.extras?.state || history.state;

    if (navState && navState['isViewOnly']) {
      this.isViewOnly.set(true);
      this.headerTitle.set('Immunization Record View');

      const targetId = navState['childId'] ? Number(navState['childId']) : null;
      if (targetId) {
        this.loadReadOnlyChildRecord(targetId, navState['childData']);
      }
      return;
    }

    this.fetchChildrenFromDatabase();
  }

  private loadReadOnlyChildRecord(childId: number, fallbackData?: any) {
    const baseProfile: ChildProfile = {
      id: childId,
      name: fallbackData?.fullName || fallbackData?.name || 'Beneficiary',
      age: fallbackData?.ageMonths ?? fallbackData?.age ?? 0,
      purok: fallbackData?.purok || '',
      overallStatus: 'Fully Immunized',
      vaccines: this.standardVaccineNames.map(name => ({
        vaccineName: name,
        completed: false,
        dateGiven: undefined
      }))
    };

    this.currentChild.set(baseProfile);
    this.cdr.detectChanges();

    fetch(`http://localhost:8000/api/children/${childId}`)
      .then(res => res.json())
      .then(res => {
        if (res && res.success && res.data) {
          const d = res.data;
          const updatedProfile: ChildProfile = {
            ...(this.currentChild() || baseProfile),
            id: d.id,
            name: d.name,
            age: d.age,
            purok: d.purok,
            overallStatus: d.overall_status && d.overall_status.trim() !== '' ? d.overall_status : 'Fully Immunized'
          };
          this.currentChild.set(updatedProfile);
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error fetching child profile for view-only:', err));

    fetch(`http://localhost:8000/api/vaccinations/${childId}`)
      .then(res => res.json())
      .then(response => {
        const active = this.currentChild();
        if (active && response && response.success && Array.isArray(response.data)) {
          const updatedVaccines = active.vaccines.map(v => {
            const found = response.data.find(
              (dbVac: any) =>
                String(dbVac.vaccine_name || '').trim().toLowerCase() === v.vaccineName.trim().toLowerCase()
            );
            if (found) {
              return {
                ...v,
                completed: found.status === 'Given',
                dateGiven: found.date_given || undefined
              };
            }
            return v;
          });
          this.currentChild.set({
            ...active,
            vaccines: updatedVaccines
          });
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error fetching vaccinations for view-only:', err));
  }

  fetchChildrenFromDatabase() {
    fetch('http://localhost:8000/api/children')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          const mapped: ChildProfile[] = response.data.map((child: any) => ({
            id: child.id,
            name: child.name,
            age: child.age,
            purok: child.purok,
            overallStatus: child.overall_status && child.overall_status.trim() !== '' ? child.overall_status : 'Select',
            vaccines: this.standardVaccineNames.map(name => ({
              vaccineName: name,
              completed: false,
              dateGiven: undefined
            }))
          }));
          this.childrenList.set(mapped);
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error fetching children from database:', err));
  }

  onSearchChange(value: string) {
    this.searchTerm.set(value);
    if (value.trim()) {
      this.currentChild.set(null);
    }
  }

  selectChild(child: ChildProfile) {
    const resetVaccines = child.vaccines.map(v => ({
      ...v,
      completed: false,
      dateGiven: undefined
    }));

    const selected: ChildProfile = {
      ...child,
      vaccines: resetVaccines
    };

    this.currentChild.set(selected);
    this.searchTerm.set('');
    this.cdr.detectChanges();

    fetch(`http://localhost:8000/api/vaccinations/${child.id}`)
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          const hydratedVaccines = selected.vaccines.map(v => {
            const found = response.data.find(
              (dbVac: any) =>
                String(dbVac.vaccine_name || '').trim().toLowerCase() === v.vaccineName.trim().toLowerCase()
            );
            if (found) {
              return {
                ...v,
                completed: found.status === 'Given',
                dateGiven: found.date_given || undefined
              };
            }
            return v;
          });
          this.currentChild.set({
            ...selected,
            vaccines: hydratedVaccines
          });
          this.cdr.detectChanges();
        }
      })
      .catch(err => console.error('Error fetching child vaccinations:', err));
  }

  updateOverallStatus(status: string) {
    if (this.isViewOnly()) return;
    const active = this.currentChild();
    if (!active) return;
    this.currentChild.set({
      ...active,
      overallStatus: status
    });
  }

  toggleVaccine(item: VaccineRecord) {
    if (this.isViewOnly()) return;
    const active = this.currentChild();
    if (!active) return;

    item.completed = !item.completed;
    const currentDateTime = item.completed ? new Date().toISOString().slice(0, 19).replace('T', ' ') : '';
    item.dateGiven = item.completed ? currentDateTime : undefined;

    this.checkAutoStatus();
  }

  async presentToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'bottom',
      color: color,
      mode: 'ios',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  async saveOverallStatus() {
    if (this.isViewOnly()) return;
    const active = this.currentChild();
    if (!active) return;

    const payload = {
      child_id: active.id,
      overall_status: active.overallStatus,
      vaccines: active.vaccines.map(v => ({
        vaccine_name: v.vaccineName,
        status: v.completed ? 'Given' : 'Pending',
        date_given: v.dateGiven || null
      }))
    };

    fetch('http://localhost:8000/api/children/save-full-vaccination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(async data => {
        console.log('Full record saved successfully:', data);

        const toast = await this.toastController.create({
          message: 'Overall status and vaccination records successfully saved!',
          duration: 3000,
          position: 'bottom',
          color: 'success',
          mode: 'ios',
          cssClass: 'custom-toast',
          buttons: [
            {
              text: 'View',
              role: 'info',
              handler: () => {
                this.router.navigate(['/fully-immunized']);
              }
            }
          ]
        });
        await toast.present();
      })
      .catch(async err => {
        console.error('Error saving full record:', err);
        await this.presentToast('Failed to save vaccination records.', 'danger');
      });
  }

  checkAutoStatus() {
    const active = this.currentChild();
    if (!active) return;

    const allDone = active.vaccines.every(v => v.completed);
    let nextStatus = active.overallStatus;
    if (allDone) {
      nextStatus = 'Fully Immunized';
    } else {
      const anyDone = active.vaccines.some(v => v.completed);
      nextStatus = anyDone ? 'Partially Immunized' : 'Unvaccinated';
    }

    this.currentChild.set({
      ...active,
      overallStatus: nextStatus
    });
  }
}