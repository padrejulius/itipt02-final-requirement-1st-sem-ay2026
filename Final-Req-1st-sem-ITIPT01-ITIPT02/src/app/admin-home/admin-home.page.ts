import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton,IonIcon, AlertController, ToastController, IonItem, IonLabel, IonList, IonBadge, IonFooter} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { settingsOutline, personCircleOutline, trashOutline, peopleOutline,alertCircleOutline, shieldCheckmarkOutline, chevronForwardOutline,personAddOutline, calendarOutline, medicalOutline, personOutline,notificationsOutline, searchOutline} from 'ionicons/icons';

@Component({
  selector: 'app-admin-home',
  templateUrl: './admin-home.page.html',
  styleUrls: ['./admin-home.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, HttpClientModule,IonHeader,IonToolbar, IonTitle,IonContent, IonButtons,IonButton,IonIcon, IonItem,IonLabel,IonList,IonBadge, IonFooter ]})


  export class AdminHomePage implements OnInit {
  healthWorkerName: string = 'Administrator';
  assignedPurok: string = 'All Puroks';

  totalChildren: number = 0;
  feedingProgramCount: number = 0;
  fullyImmunizedCount: number = 0;

  searchTerm: string = '';
  upcomingVaccines: any[] = [];

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
      'calendar-outline': calendarOutline,
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
          this.totalChildren = response.data.length;

          const underweightList = response.data.filter((child: any) => {
            const status = child.nutritional_status ? child.nutritional_status.trim().toLowerCase() : '';
            return status.includes('underweight');
          });
          this.feedingProgramCount = underweightList.length;

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
          this.fullyImmunizedCount = response.data.length;
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
          this.upcomingVaccines = response.data.map((item: any) => ({
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
          this.cdr.detectChanges();
        } else {
          this.upcomingVaccines = [];
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching upcoming vaccines:', err);
      }
    });
  }

  get filteredVaccines() {
    if (!this.searchTerm.trim()) {
      return this.upcomingVaccines;
    }
    const term = this.searchTerm.toLowerCase();
    return this.upcomingVaccines.filter(item =>
      item.childName.toLowerCase().includes(term) ||
      item.vaccineType.toLowerCase().includes(term) ||
      item.purok.toLowerCase().includes(term)
    );
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
                  this.upcomingVaccines = this.upcomingVaccines.filter(item => item.id !== alert.id);
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