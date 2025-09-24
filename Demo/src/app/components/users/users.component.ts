import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService, User } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { ConfirmDeleteComponent } from '../confirm-delete/confirm-delete.component';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmDeleteComponent],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss'
})
export class UsersComponent implements OnInit {
  users: User[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';
  currentUser: any;
  
  // Confirm delete modal properties
  showConfirmDelete = false;
  userToDelete: User | null = null;
  deleting = false;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
  }

  title: string = 'Manage all users';

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    this.userService.getAllUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        this.loading = false;
        this.successMessage = `Successfully loaded ${users.length} ${users.length === 1 ? 'user' : 'users'}`;
        
        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error: any) => {
        this.loading = false;
        this.errorMessage = 'Failed to load users. Please try again.';
        console.error('Error loading users:', error);
      }
    });
  }

  editUser(user: User): void {
    const userId = user.id || user._id;
    this.router.navigate(['/user', userId]);
  }

  deleteUser(user: User): void {
    const userId = user.id || user._id;
    const currentUserId = this.currentUser?.id || this.currentUser?._id;
    
    if (currentUserId && userId === currentUserId) {
      this.errorMessage = 'You cannot delete yourself!';
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
      return;
    }

    // Show confirm delete modal
    this.userToDelete = user;
    this.showConfirmDelete = true;
  }

  confirmDeleteUser(): void {
    if (!this.userToDelete) return;
    
    const userId = this.userToDelete.id || this.userToDelete._id;
    this.deleting = true;
    
    this.userService.deleteUserById(userId).subscribe({
      next: () => {
        this.deleting = false;
        this.showConfirmDelete = false;
        this.successMessage = `User ${this.userToDelete!.name} has been successfully deleted.`;
        this.userToDelete = null;
        this.loadUsers(); // Refresh the list
      },
      error: (error: any) => {
        this.deleting = false;
        this.showConfirmDelete = false;
        
        if (error.status === 403) {
          this.errorMessage = 'You are not allowed to delete this user.';
        } else {
          this.errorMessage = 'Failed to delete user. Please try again.';
        }
        setTimeout(() => {
          this.errorMessage = '';
        }, 5000);
        console.error('Error deleting user:', error);
        this.userToDelete = null;
      }
    });
  }

  cancelDeleteUser(): void {
    this.showConfirmDelete = false;
    this.userToDelete = null;
    this.deleting = false;
  }

  trackByUserId(index: number, user: User): string {
    return user.id || user._id;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
