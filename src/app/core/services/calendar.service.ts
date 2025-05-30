import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Schedule } from '../models/course.model';
import { CourseService } from './course.service';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  constructor(
    private courseService: CourseService,
    private sessionService: SessionService
  ) {}

  // Récupérer tous les événements pour le calendrier
  getCalendarEvents(start: Date, end: Date): Observable<Schedule[]> {
    return forkJoin({
      courses: this.courseService.getCoursesByDateRange(start, end),
      sessions: this.sessionService.getSessionsByDateRange(start, end)
    }).pipe(
      map(result => {
        const courseEvents = this.courseService.convertCoursesToSchedule(result.courses);
        
        // Convertir les sessions en événements pour le calendrier
        const sessionEvents: Schedule[] = result.sessions.map(session => ({
          id: session.session_id,
          title: session.label,
          start: new Date(session.started_at),
          end: new Date(session.finished_at),
          sessionId: session.session_id,
          color: '#3788d8',
          allDay: true
        }));
        
        return [...courseEvents, ...sessionEvents];
      })
    );
  }
  
  // Mettre à jour un événement après drag & drop
  updateEventTimes(event: Schedule): Observable<any> {
    if (event.courseId) {
      // C'est un cours
      return this.courseService.getCourseById(event.courseId).pipe(
        map(course => {
          const updatedCourse = {
            ...course,
            day_: new Date(event.start.toISOString().split('T')[0]),
            start_hour: event.start,
            end_hour: event.end
          };
          return this.courseService.updateCourse(updatedCourse);
        })
      );
    } else if (event.sessionId) {
      // C'est une session
      return this.sessionService.getSessionById(event.sessionId).pipe(
        map(session => {
          const updatedSession = {
            ...session,
            started_at: event.start,
            finished_at: event.end
          };
          return this.sessionService.updateSession(updatedSession);
        })
      );
    }
    
    return of(null);
  }
  
  // Vérifier les conflits d'horaires
  checkScheduleConflicts(event: Schedule, events: Schedule[]): boolean {
    // Exclure l'événement lui-même s'il est déjà dans la liste
    const otherEvents = events.filter(e => 
      e.id !== event.id && (
        (e.groupId === event.groupId) || // Même groupe
        (!e.allDay && !event.allDay) // Cours (pas des sessions)
      )
    );
    
    // Vérifier les chevauchements
    return otherEvents.some(e => {
      return (event.start < e.end && event.end > e.start);
    });
  }
} 