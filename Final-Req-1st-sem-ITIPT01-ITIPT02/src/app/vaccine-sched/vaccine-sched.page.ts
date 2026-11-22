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
  schedulesList = signal<any[]>([]);
  private lastNotifiedKey: string = '';
  private isToastShowing: boolean = false;

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
    this.fetchSchedulesFromDatabase();

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

  private isArchivedFlag(val: any): boolean {
    return val === 1 || val === true || String(val).toLowerCase() === '1' || String(val).toLowerCase() === 'true';
  }

  private getChildScheduleArchiveState(child: any): { hasActiveSchedule: boolean; hasArchivedSchedule: boolean } {
    const childId = child?.id;
    const childName = String(child?.name || '').trim().toLowerCase();

    const matchingSchedules = this.schedulesList().filter((s: any) => {
      const schedChildId = s?.childId ?? s?.child_id;
      if (childId !== undefined && childId !== null && schedChildId !== undefined && schedChildId !== null) {
        return Number(schedChildId) === Number(childId);
      }
      const schedChildName = String(s?.childName ?? s?.child_name ?? '').trim().toLowerCase();
      return childName !== '' && schedChildName === childName;
    });

    if (matchingSchedules.length === 0) {
      return { hasActiveSchedule: false, hasArchivedSchedule: true };
    }

    const hasActiveSchedule = matchingSchedules.some((s: any) => {
      const flag = s?.is_archived ?? s?.isArchived ?? 0;
      return !this.isArchivedFlag(flag);
    });

    const hasArchivedSchedule = matchingSchedules.some((s: any) => {
      const flag = s?.is_archived ?? s?.isArchived ?? 0;
      return this.isArchivedFlag(flag);
    });

    return { hasActiveSchedule, hasArchivedSchedule };
  }

  canScheduleChild(child: any): boolean {
    if (!child) return false;
    const childArchived = this.isArchivedFlag(child?.is_archived ?? child?.isArchived ?? 0);
    if (childArchived) {
      return false;
    }
    const { hasActiveSchedule } = this.getChildScheduleArchiveState(child);
    return !hasActiveSchedule;
  }

  private getBlockedScheduleMessage(child: any): string {
    const childArchived = this.isArchivedFlag(child?.is_archived ?? child?.isArchived ?? 0);
    if (childArchived) {
      return `Cannot set schedule for ${child.name}: child record is currently archived.`;
    }
    return `Cannot set schedule for ${child.name}: this child already has an active schedule.`;
  }

  private checkSearchBarScheduleRule(rawQuery: string, isEnterPressed: boolean = false): void {
    const trimmed = String(rawQuery || '').trim().toLowerCase();
    if (!trimmed) {
      this.lastNotifiedKey = '';
      return;
    }

    // Kapag Enter ang pinindot, hanapin kahit partial match; kapag nagta-type pa lang, exact full name match lang
    const matchedChild = isEnterPressed
      ? this.childrenList().find((c: any) =>
          String(c.name || '').trim().toLowerCase().includes(trimmed)
        )
      : this.childrenList().find((c: any) =>
          String(c.name || '').trim().toLowerCase() === trimmed
        );

    if (matchedChild) {
      if (!this.canScheduleChild(matchedChild)) {
        const notifyKey = `${matchedChild.id ?? matchedChild.name}`;
        if ((isEnterPressed || this.lastNotifiedKey !== notifyKey) && !this.isToastShowing) {
          this.lastNotifiedKey = notifyKey;
          this.presentToast(this.getBlockedScheduleMessage(matchedChild), 'danger');
        }
      } else {
        this.lastNotifiedKey = '';
      }
    } else {
      this.lastNotifiedKey = '';
    }
  }

  fetchSchedulesFromDatabase(): void {
    this.http.get<any>('http://localhost:8000/api/vaccine-schedules').subscribe({
      next: (response) => {
        if (response && response.success && Array.isArray(response.data)) {
          this.schedulesList.set(response.data);
          this.cdr.detectChanges();
        } else if (Array.isArray(response)) {
          this.schedulesList.set(response);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching vaccine schedules:', err);
      }
    });
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
          this.cdr.detectChanges();
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

    const trimmed = String(value || '').trim().toLowerCase();
    this.isSearching.set(trimmed !== '');
    this.checkSearchBarScheduleRule(value, false);
    this.cdr.detectChanges();
  }

  onSearchInput(event: any): void {
    const val = event?.detail?.value ?? event?.target?.value ?? '';
    this.searchQuery.set(val);
    if (this.isViewOnly()) return;

    const trimmed = String(val || '').trim().toLowerCase();
    this.isSearching.set(trimmed !== '');
    this.checkSearchBarScheduleRule(val, false);
    this.cdr.detectChanges();
  }

  onSearchFocus(_event: any): void {
    if (this.isViewOnly()) return;
    const trimmed = String(this.searchQuery() || '').trim().toLowerCase();
    if (trimmed) {
      this.isSearching.set(true);
      this.cdr.detectChanges();
    }
  }

  onSearchClear(): void {
    this.searchQuery.set('');
    this.lastNotifiedKey = '';
    this.isSearching.set(false);
    this.cdr.detectChanges();
  }

  onSearchEnter(event: any): void {
    event?.preventDefault?.();
    if (this.isViewOnly()) return;
    this.checkSearchBarScheduleRule(this.searchQuery(), true);
    this.cdr.detectChanges();
  }

  selectChild(child: any): void {
    if (this.isViewOnly()) return;

    if (!this.canScheduleChild(child)) {
      this.lastNotifiedKey = `${child?.id ?? child?.name}`;
      this.presentToast(this.getBlockedScheduleMessage(child), 'danger');
      return;
    }

    this.lastNotifiedKey = '';
    this.schedule.update(current => ({
      ...current,
      childId: child.id,
      childName: child.name,
      contact: child.contact || ''
    }));
    this.searchQuery.set(child.name);
    this.isSearching.set(false);
    this.cdr.detectChanges();
  }

  async presentToast(message: string, color: string = 'success') {
    this.isToastShowing = true;
    const toast = await this.toastController.create({
      message: message,
      duration: 2500,
      position: 'bottom',
      color: color,
      mode: 'ios',
      cssClass: 'custom-toast'
    });
    toast.onDidDismiss().then(() => {
      this.isToastShowing = false;
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

    if (!this.isEditMode()) {
      const matchedChild = this.childrenList().find((c: any) =>
        (currentSchedule.childId !== null && Number(c.id) === Number(currentSchedule.childId)) ||
        String(c.name || '').trim().toLowerCase() === String(currentSchedule.childName || '').trim().toLowerCase()
      );

      if (matchedChild && !this.canScheduleChild(matchedChild)) {
        this.presentToast(this.getBlockedScheduleMessage(matchedChild), 'warning');
        return;
      }
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
          this.fetchSchedulesFromDatabase();
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
    this.lastNotifiedKey = '';
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