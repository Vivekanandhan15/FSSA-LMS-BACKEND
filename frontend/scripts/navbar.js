import { logout } from './auth.js';

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("sidebar");
  const toggleBtn = document.getElementById("navToggle");

  if (!sidebar || !toggleBtn) {
    console.error("Sidebar elements not found");
    return;
  }

  toggleBtn.addEventListener("click", () => {
    sidebar.classList.toggle("collapsed");
  });

  // Role-based Nav
  const user = JSON.parse(localStorage.getItem('user'));
  const navMenu = document.querySelector('.nav-menu');

  if (navMenu) {
    // Add "Manage Courses" if admin
    if (user && user.role === 'admin') {
      if (!Array.from(navMenu.querySelectorAll('a')).some(a => a.href.includes('admin_course.html'))) {
        const manageLink = document.createElement('a');
        manageLink.href = '/pages/admin_course.html';
        manageLink.innerText = 'Manage Courses';
        navMenu.appendChild(manageLink);
      }
    }

    // Logout button
    const logoutBtn = document.createElement('a');
    logoutBtn.href = "#";
    logoutBtn.innerText = "Logout";
    logoutBtn.classList.add('logout-btn');
    logoutBtn.onclick = (e) => {
      e.preventDefault();
      logout();
    };
    navMenu.appendChild(logoutBtn);
  }
});
