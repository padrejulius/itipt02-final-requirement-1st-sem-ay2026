import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonItem, IonLabel, IonList, IonBadge, IonFooter, AlertController,ToastController} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { settingsOutline, personCircleOutline, peopleOutline, alertCircleOutline, shieldCheckmarkOutline, chevronForwardOutline, personAddOutline, calendarOutline, medicalOutline, personOutline, notificationsOutline, searchOutline, trashOutline} from 'ionicons/icons';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, HttpClientModule, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon, IonItem, IonLabel, IonList, IonBadge,IonFooter ]})

  export class AdminHomePage implements OnInit {
  healthWorkerName = signal<string>('Administrator');
  assignedPurok = signal<string>('All Puroks');

  totalChildren = signal<number>(0);
  feedingProgramCount = signal<number>(0);
  fullyImmunizedCount = signal<number>(0);

  searchTerm = signal<string>('');
  upcomingVaccines = signal<any[]>([]);

  filteredVaccines = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    const list = this.upcomingVaccines();
    if (!term) {
      return list;
    }
    return list.filter(item =>
      String(item.childName || '').toLowerCase().includes(term) ||
      String(item.vaccineType || '').toLowerCase().includes(term) ||
      String(item.purok || '').toLowerCase().includes(term)
    );
  });

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private alertController: AlertController,
    private toastController: ToastController
  ) {
    addIcons({
      'settings-outline': settingsOutline,
      'person-circle-outline': personCircleOutline,
      'people-outline': peopleOutline,
      'alert-circle-outline': alertCircleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'person-add-outline': personAddOutline,
      'schedule-outline': calendarOutline,
      'medical-outline': medicalOutline,
      'person-outline': personOutline,
      'notifications-outline': notificationsOutline,
      'search-outline': searchOutline,
      'trash-outline': trashOutline
    });
  }

  ngOnInit(): void {
    this.loadDashboardData();
    this.loadUpcomingVaccines();
  }

  ionViewWillEnter(): void {
    this.loadDashboardData();
    this.loadUpcomingVaccines();
  }

  loadDashboardData(): void {
    this.http.get<any>('http://localhost:8000/api/children').subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.totalChildren.set(response.data.length);

          const underweightList = response.data.filter((child: any) => {
            const status = child.nutritional_status ? child.nutritional_status.trim().toLowerCase() : '';
            return status.includes('underweight');
          });
          this.feedingProgramCount.set(underweightList.length);

          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching dashboard summary:', err);
      }
    });

    this.http.get<any>('http://localhost:8000/api/children/fully-immunized').subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          this.fullyImmunizedCount.set(response.data.length);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching fully immunized count:', err);
      }
    });
  }

  loadUpcomingVaccines(): void {
    this.http.get<any>('http://localhost:8000/api/vaccine-schedules/upcoming').subscribe({
      next: (response) => {
        if (response && response.success && response.data) {
          const mapped = response.data.map((item: any) => ({
            id: item.id,
            childId: item.child_id,
            childName: item.child_name,
            vaccineType: item.vaccine_name,
            date: item.sched_date,
            schedTime: item.sched_time,
            contact: item.contact,
            remarks: item.remarks,
            status: item.status,
            purok: item.purok || 'Purok 1'
          }));
          this.upcomingVaccines.set(mapped);
          this.cdr.detectChanges();
        } else {
          this.upcomingVaccines.set([]);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching upcoming vaccines:', err);
      }
    });
  }

  async removeSchedule(alert: any) {
    if (!alert || !alert.id) return;

    const alertPopup = await this.alertController.create({
      header: 'Confirm Archive',
      message: `Are you sure you want to remove ${alert.childName} from schedules?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Yes, Remove',
          handler: () => {
            this.http.put<any>(`http://localhost:8000/api/schedules/archive/${alert.id}`, {}).subscribe({
              next: async (response) => {
                if (response && response.success) {
                  this.upcomingVaccines.update(list => list.filter(item => item.id !== alert.id));
                  this.cdr.markForCheck();

                  const toast = await this.toastController.create({
                    message: `${alert.childName}'s schedule successfully archived.`,
                    duration: 3000,
                    position: 'bottom',
                    color: 'danger',
                    mode: 'ios',
                    buttons: [
                      {
                        text: 'View',
                        role: 'info',
                        handler: () => {
                          this.router.navigate(['/archive-schedule']);
                        }
                      }
                    ]
                  });
                  await toast.present();
                }
              },
              error: (err) => {
                console.error('Error archiving schedule:', err);
              }
            });
          }
        }
      ]
    });

    await alertPopup.present();
  }

  openScheduleDetails(alert: any): void {
    if (!alert || !alert.id) return;
    this.router.navigate(['/vaccine-sched'], {
      state: { scheduleData: alert, scheduleId: alert.id }
    });
  }

  goToChildDict(): void {
    this.router.navigate(['/child-dict']);
  }

  viewFeedingProgram(): void {
    this.router.navigate(['/feeding-list']);
  }

  goToImmunizedList(): void {
    this.router.navigate(['/fully-immunized']);
  }

  addChild(): void {
    this.router.navigate(['/add-child']);
  }

  viewVaccineSched(): void {
    this.router.navigate(['/vaccine-sched']);
  }

  goToSettings(): void {
    this.router.navigate(['/settings']);
  }

  goToVaccine(): void {
    this.router.navigate(['/vaccine']);
  }
}