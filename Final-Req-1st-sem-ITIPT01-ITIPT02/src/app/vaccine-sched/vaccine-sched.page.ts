import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonItem, IonSelect, IonSelectOption, IonInput, IonButton, IonIcon, IonList, IonLabel, ToastController } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { calendarOutline } from 'ionicons/icons';

@Component({
  selector: 'app-vaccine-sched',
  templateUrl: './vaccine-sched.page.html',
  styleUrls: ['./vaccine-sched.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, HttpClientModule, IonContent, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonItem, IonSelect, IonSelectOption, IonInput, IonButton, IonIcon, IonList, IonLabel, RouterLink ] })

export class VaccineSchedPage implements OnInit {
  searchQuery = signal<string>('');
  isSearching = signal<boolean>(false);
  isEditMode = signal<boolean>(false);
  scheduleId = signal<any>(null);

  isViewOnly = signal<boolean>(false);
  headerTitle = signal<string>('Vaccine Schedule');

  childrenList = signal<any[]>([]);

  filteredChildren = computed(() => {
    if (this.isViewOnly() || !this.isSearching()) {
      return [];
    }
    const query = this.searchQuery().trim().toLowerCase();
    if (!query) {
      return [];
    }
    return this.childrenList().filter(child =>
      String(child.name).toLowerCase().includes(query)
    );
  });

  schedule = signal({
    childId: null as number | null,
    childName: '',
    vaccineName: '',
    schedDate: '',
    schedTime: '',
    contact: '',
    remarks: '',
    status: 'Scheduled'
  });

  submitButtonText = computed(() => {
    if (this.isViewOnly()) return '';
    return this.isEditMode() ? 'UPDATE SCHEDULE' : 'SET SCHEDULE & NOTIFY';
  });

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private toastController: ToastController
  ) {
    addIcons({ 'calendar-outline': calendarOutline });
  }

  ngOnInit(): void {
    this.fetchChildrenFromDatabase();

    const navigation = this.router.getCurrentNavigation();
    const navState = navigation?.extras?.state || history.state;

    if (navState) {
      if (navState['isViewOnly']) {
        this.isViewOnly.set(true);
        this.headerTitle.set('Old Schedule');
      }

      if (navState['scheduleData'] || navState['scheduleId']) {
        const data = navState['scheduleData'];
        const id = data?.id || navState['scheduleId'];
        this.scheduleId.set(id);
        this.isEditMode.set(true);

        if (id) {
          this.fetchScheduleDetails(id);
        }
      }
    }
  }

  updateScheduleField(field: string, value: any): void {
    this.schedule.update(current => ({
      ...current,
      [field]: value
    }));
  }

  fetchScheduleDetails(id: any): void {
    this.http.get<any>(`http://localhost:8000/api/vaccine-schedules/${id}`).subscribe({
      next: (res) => {
        if (res && res.success && res.data) {
          const d = res.data;

          let formattedTime = '';
          const rawTime = d.schedTime || d.sched_time || '';
          if (rawTime) {
            const timeStr = String(rawTime).trim();
            if (timeStr.includes(':')) {
              const parts = timeStr.split(':');
              formattedTime = `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
            }
          }

          const childName = d.childName || d.child_name || '';
          this.schedule.set({
            childId: d.childId || d.child_id || null,
            childName: childName,
            vaccineName: d.vaccineName || d.vaccine_name || '',
            schedDate: d.schedDate || d.sched_date || '',
            schedTime: formattedTime,
            contact: d.contact || '',
            remarks: d.remarks || '',
            status: d.status || 'Scheduled'
          });
          this.searchQuery.set(childName);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching schedule details:', err);
      }
    });
  }

  fetchChildrenFromDatabase(): void {
    this.http.get<any>('http://localhost:8000/api/children').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.childrenList.set(response.data);
        }
      },
      error: (err) => {
        console.error('Error fetching children:', err);
      }
    });
  }

  onSearchQueryChange(value: string): void {
    this.searchQuery.set(value);
    if (this.isViewOnly()) return;
    this.isSearching.set(value.trim() !== '');
  }

  selectChild(child: any): void {
    if (this.isViewOnly()) return;
    this.schedule.update(current => ({
      ...current,
      childId: child.id,
      childName: child.name,
      contact: child.contact || ''
    }));
    this.searchQuery.set(child.name);
    this.isSearching.set(false);
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

  saveVaccineSchedule(): void {
    if (this.isViewOnly()) return;

    const currentSchedule = this.schedule();
    if (!currentSchedule.vaccineName || !currentSchedule.schedDate || !currentSchedule.schedTime) {
      this.presentToast('Please fill in all required fields.', 'danger');
      return;
    }

    if (this.isEditMode()) {
      this.http.put(`http://localhost:8000/api/vaccine-schedules/update/${this.scheduleId()}`, currentSchedule).subscribe({
        next: async (response: any) => {
          if (response && response.success === false) {
            await this.presentToast(response.message, 'warning');
            return;
          }
          await this.presentToast(`Vaccine schedule successfully updated for ${currentSchedule.childName}!`);
          this.router.navigate(['/admin-home']);
        },
        error: async (err) => {
          console.error('Error updating schedule:', err);
          await this.presentToast('An error occurred while updating the database.', 'danger');
        }
      });
    } else {
      this.http.post('http://localhost:8000/api/vaccine-schedules', currentSchedule).subscribe({
        next: async (response: any) => {
          if (response && response.success === false) {
            await this.presentToast(response.message, 'warning');
            return;
          }

          await this.presentToast(`Vaccine schedule successfully saved for ${currentSchedule.childName}!`);
          this.resetForm();
        },
        error: async (err) => {
          console.error('Error saving schedule:', err);
          const errorMsg = err.error?.detail || 'An error occurred while saving to the database.';
          await this.presentToast(errorMsg, 'danger');
        }
      });
    }
  }

  resetForm(): void {
    if (this.isViewOnly()) return;
    this.searchQuery.set('');
    this.schedule.set({
      childId: null,
      childName: '',
      vaccineName: '',
      schedDate: '',
      schedTime: '',
      contact: '',
      remarks: '',
      status: 'Scheduled'
    });
    this.isSearching.set(false);
    this.cdr.detectChanges();
  }
}