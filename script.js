document.addEventListener('DOMContentLoaded', () => {
    // === Password Toggle ===
    const togglePassword = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
  
    if (togglePassword && passwordInput && eyeIcon) {
      togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        eyeIcon.classList.toggle('fa-eye-slash');
        eyeIcon.classList.toggle('fa-eye');
      });
    }
  
    // === Login Logic ===
    const loginForm = document.getElementById("loginForm");
    const dashboard = document.getElementById("dashboard");
    const loginSection = document.getElementById("loginSection");
  
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();
  
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value.trim();
  
      if (email === "aqua@spark.com" && password === "password") {
        dashboard.style.display = "block";
        loginSection.style.display = "none";
        alert("Login successful");
  
        let drawer = new bootstrap.Offcanvas('#settingsDrawer');
        drawer.show();
      } else {
        alert("Invalid login credentials.");
      }
    });
  
    // === Drawer Manual Trigger ===
    window.openDrawer = function () {
      const drawer = new bootstrap.Offcanvas('#settingsDrawer');
      drawer.show();
    };
  
    // === Inventory ===
    const stock = [];
  
    window.addItem = function () {
      const name = document.getElementById('itemName').value.trim();
      const qty = parseInt(document.getElementById('itemQty').value);
      const price = parseFloat(document.getElementById('itemPrice').value);
  
      if (!name || isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
        alert("Please enter valid item details.");
        return;
      }
  
      stock.push({ name, qty, price });
      renderStock();
  
      document.getElementById('itemName').value = '';
      document.getElementById('itemQty').value = '';
      document.getElementById('itemPrice').value = '';
    };
  
    function renderStock() {
      const table = document.getElementById('stockTable');
      table.innerHTML = '';
      stock.forEach((item, index) => {
        table.innerHTML += `
          <tr>
            <td>${item.name}</td>
            <td>${item.qty}</td>
            <td>₱${item.price.toFixed(2)}</td>
            <td><button onclick="removeStock(${index})" class="btn btn-sm btn-danger">Remove</button></td>
          </tr>`;
      });
  
      const salesItemSelect = document.getElementById('salesItem');
      if (salesItemSelect) {
        salesItemSelect.innerHTML = '<option selected disabled>Select Item</option>';
        stock.forEach(item => {
          const opt = document.createElement("option");
          opt.value = item.name;
          opt.textContent = item.name;
          salesItemSelect.appendChild(opt);
        });
      }
    }
  
    window.removeStock = function (index) {
      stock.splice(index, 1);
      renderStock();
    };
  
    // === Sales ===
    const salesHistory = [];
  
    window.recordSale = function () {
      const itemName = document.getElementById('salesItem').value;
      const qty = parseInt(document.getElementById('salesQty').value);
  
      if (!itemName || isNaN(qty) || qty <= 0) {
        alert("Please select a valid item and quantity.");
        return;
      }
  
      const stockItem = stock.find(item => item.name === itemName);
      if (!stockItem) {
        alert("Item not found in stock.");
        return;
      }
  
      if (stockItem.qty < qty) {
        alert("Insufficient stock.");
        return;
      }
  
      stockItem.qty -= qty;
      renderStock();
  
      const total = qty * stockItem.price;
      const date = new Date().toLocaleString();
      salesHistory.push({ item: itemName, qty, total, date });
  
      renderSalesTable();
      renderDailySales();
  
      document.getElementById('latestReceipt').textContent =
        `Item: ${itemName}\nQty: ${qty}\nTotal: ₱${total.toFixed(2)}\nDate: ${date}`;
  
      document.getElementById('salesQty').value = '';
    };
  
    function renderSalesTable() {
      const body = document.getElementById('salesTableBody');
      body.innerHTML = '';
      salesHistory.forEach(sale => {
        body.innerHTML += `
          <tr>
            <td>${sale.item}</td>
            <td>${sale.qty}</td>
            <td>₱${sale.total.toFixed(2)}</td>
            <td>${sale.date}</td>
          </tr>`;
      });
    }
  
    window.clearSales = function () {
      if (confirm("Are you sure you want to clear all sales history?")) {
        salesHistory.length = 0;
        renderSalesTable();
        renderDailySales();
        document.getElementById('latestReceipt').textContent = 'No sales yet.';
      }
    };
  
    function getDailySalesSummary() {
      const summary = {};
      salesHistory.forEach(({ total, date }) => {
        const day = new Date(date).toLocaleDateString();
        if (!summary[day]) {
          summary[day] = 0;
        }
        summary[day] += total;
      });
      return summary;
    }
  
    function renderDailySales() {
      const summary = getDailySalesSummary();
      const containers = [
        document.getElementById('dailySalesReport'),
        document.getElementById('dailySalesData')
      ].filter(Boolean);
  
      containers.forEach(container => {
        container.innerHTML = '';
  
        if (Object.keys(summary).length === 0) {
          container.innerHTML = '<p>No sales recorded yet.</p>';
          return;
        }
  
        for (const [date, total] of Object.entries(summary)) {
          container.innerHTML += `<p>${date}: ₱${total.toFixed(2)}</p>`;
        }
      });
    }
  
    // === Delivery ===
    const deliveries = [];
  
    window.addDelivery = function () {
      const item = document.getElementById('deliveryItem').value.trim();
      const address = document.getElementById('deliveryAddress').value.trim();
      const status = document.getElementById('deliveryStatus').value.trim();
  
      if (!item || !address || !status) {
        alert('Please enter valid delivery details.');
        return;
      }
  
      deliveries.push({ item, address, status });
      renderDelivery();
  
      document.getElementById('deliveryItem').value = '';
      document.getElementById('deliveryAddress').value = '';
      document.getElementById('deliveryStatus').value = '';
    };
  
    function renderDelivery() {
      const deliveryTable = document.getElementById('deliveryTable');
      deliveryTable.innerHTML = '';
      deliveries.forEach(delivery => {
        deliveryTable.innerHTML += `
          <tr>
            <td>${delivery.item}</td>
            <td>${delivery.address}</td>
            <td>${delivery.status}</td>
          </tr>`;
      });
    }
  
    // === Navigation ===
    window.showSection = function (sectionId) {
      document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById(sectionId);
      if (target) target.classList.add('active');
    };
  
    // === Map ===
    let map = L.map('map').setView([12.3186, 122.0870], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);
  
    let marker;
  
    window.locateOnMap = function () {
      const query = document.getElementById('truckLocationInput').value.trim();
      if (!query) {
        alert('Please enter a location or coordinates.');
        return;
      }
  
      try {
        const [lat, lng] = query.split(',').map(Number);
        if (!isNaN(lat) && !isNaN(lng)) {
          if (marker) map.removeLayer(marker);
          marker = L.marker([lat, lng]).addTo(map).bindPopup("Truck Location").openPopup();
          map.setView([lat, lng], 13);
        } else {
          alert('Invalid input. Please use the format: lat,lng');
        }
      } catch {
        alert('Invalid input. Please use the format: lat,lng');
      }
    };
  
    // === Sales Report Navigation ===
    window.showSales = function (type) {
      showSection(type === 'weekly' ? 'weeklySales' : 'monthlySales');
    };
  
    // === Logout ===
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to logout?")) {
          loginSection.style.display = "flex";
          dashboard.style.display = "none";
        }
      });
    }
  });
  