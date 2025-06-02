// Global variables
let stock = []
let deliveries = []
let salesHistory = []
let map
let marker
let drawerInstance
let bootstrap // Declare bootstrap variable
let L // Declare L variable

document.addEventListener("DOMContentLoaded", () => {
  // Wait a bit for Bootstrap to fully load
  setTimeout(() => {
    initializeApp()
  }, 100)
})

// Also try when window is fully loaded
window.addEventListener("load", () => {
  if (!drawerInstance) {
    console.log("Retrying offcanvas setup on window load")
    setupOffcanvas()
  }
})

function initializeApp() {
  setupEventListeners()
  initializeMap()
  loadSampleData()
  updateOverview()
  setupOffcanvas()
}

function setupEventListeners() {
  // Password toggle
  const togglePassword = document.getElementById("togglePassword")
  const passwordInput = document.getElementById("password")
  const eyeIcon = document.getElementById("eyeIcon")

  if (togglePassword && passwordInput && eyeIcon) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.type === "password" ? "text" : "password"
      passwordInput.type = type
      eyeIcon.classList.toggle("fa-eye-slash")
      eyeIcon.classList.toggle("fa-eye")
    })
  }

  // Login form
  document.getElementById("loginForm").addEventListener("submit", handleLogin)

  // Logout button
  document.getElementById("logoutBtn").addEventListener("click", handleLogout)

  // Enter key handlers for inputs
  document.getElementById("itemName").addEventListener("keypress", (e) => {
    if (e.key === "Enter") addItem()
  })

  document.getElementById("salesQty").addEventListener("keypress", (e) => {
    if (e.key === "Enter") recordSale()
  })

  document.getElementById("truckLocationInput").addEventListener("keypress", (e) => {
    if (e.key === "Enter") locateOnMap()
  })
}

function setupOffcanvas() {
  // Check if Bootstrap is available in multiple ways
  const isBootstrapLoaded =
    typeof bootstrap !== "undefined" ||
    typeof window.bootstrap !== "undefined" ||
    document.querySelector("[data-bs-toggle]")

  if (!isBootstrapLoaded) {
    console.log("Bootstrap not loaded yet, retrying...")
    setTimeout(setupOffcanvas, 200)
    return
  }

  // Get the correct Bootstrap reference
  const Bootstrap = bootstrap || window.bootstrap

  // Initialize the offcanvas
  const drawerElement = document.getElementById("settingsDrawer")
  if (drawerElement && Bootstrap && Bootstrap.Offcanvas) {
    try {
      drawerInstance = new Bootstrap.Offcanvas(drawerElement)
      console.log("Offcanvas initialized successfully")

      // Custom close button handler
      const closeBtn = document.getElementById("closeDrawerBtn")
      if (closeBtn) {
        closeBtn.addEventListener("click", (e) => {
          e.preventDefault()
          e.stopPropagation()
          closeDrawer()
        })

        // Add touch event for better mobile support
        closeBtn.addEventListener("touchend", (e) => {
          e.preventDefault()
          e.stopPropagation()
          closeDrawer()
        })
      }

      // Handle backdrop clicks
      drawerElement.addEventListener("click", (e) => {
        if (e.target === drawerElement) {
          closeDrawer()
        }
      })

      // Handle escape key
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && drawerInstance._isShown) {
          closeDrawer()
        }
      })
    } catch (error) {
      console.error("Error initializing offcanvas:", error)
    }
  } else {
    console.error("Bootstrap Offcanvas not available")
    setTimeout(setupOffcanvas, 500)
  }
}

function openDrawer() {
  if (!drawerInstance) {
    console.log("Drawer instance not found, trying to initialize...")

    // Try to initialize if not already done
    const drawerElement = document.getElementById("settingsDrawer")
    const Bootstrap = bootstrap || window.bootstrap

    if (drawerElement && Bootstrap && Bootstrap.Offcanvas) {
      try {
        drawerInstance = new Bootstrap.Offcanvas(drawerElement)
        console.log("Offcanvas initialized in openDrawer")
      } catch (error) {
        console.error("Error initializing offcanvas in openDrawer:", error)
        return
      }
    } else {
      console.error("Bootstrap or drawer element not available")
      return
    }
  }

  if (drawerInstance) {
    try {
      drawerInstance.show()
      console.log("Drawer opened successfully")
    } catch (error) {
      console.error("Error opening drawer:", error)
    }
  } else {
    console.error("Drawer instance still not available")
  }
}

function closeDrawer() {
  if (drawerInstance) {
    try {
      drawerInstance.hide()
    } catch (error) {
      console.error("Error closing drawer:", error)
    }
  }
}

function handleLogin(e) {
  e.preventDefault()
  const email = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value.trim()

  if (email === "aqua@spark.com" && password === "password") {
    document.getElementById("dashboard").style.display = "block"
    document.getElementById("loginSection").style.display = "none"

    // Show welcome notification
    showNotification("Welcome to AquaSpark POS!", "success")

    // Auto-open settings drawer
    setTimeout(() => {
      openDrawer()
    }, 1000)
  } else {
    showNotification("Invalid login credentials", "error")
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to logout?")) {
    document.getElementById("loginSection").style.display = "flex"
    document.getElementById("dashboard").style.display = "none"

    // Clear form
    document.getElementById("email").value = ""
    document.getElementById("password").value = ""

    // Reset to overview section
    showSection("overview")

    // Close drawer if open
    closeDrawer()
  }
}

function showNotification(message, type = "info") {
  // Simple notification system
  const notification = document.createElement("div")
  notification.className = `alert alert-${type === "error" ? "danger" : type === "success" ? "success" : "info"} position-fixed`
  notification.style.cssText =
    "top: 20px; left: 50%; transform: translateX(-50%); z-index: 9999; min-width: 300px; max-width: 90%;"
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="fas fa-${type === "error" ? "exclamation-triangle" : type === "success" ? "check-circle" : "info-circle"} me-2"></i>
      ${message}
    </div>
  `

  document.body.appendChild(notification)

  setTimeout(() => {
    notification.remove()
  }, 3000)
}

function showSection(sectionId) {
  // Update navigation
  document.querySelectorAll("nav a").forEach((a) => a.classList.remove("active"))
  if (event && event.target) {
    event.target.classList.add("active")
  }

  // Show section
  document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"))
  const target = document.getElementById(sectionId)
  if (target) {
    target.classList.add("active")

    // Special handling for map section
    if (sectionId === "tracking" && map) {
      setTimeout(() => map.invalidateSize(), 100)
    }
  }
}

// INVENTORY MANAGEMENT
function addItem() {
  const name = document.getElementById("itemName").value.trim()
  const qty = Number.parseInt(document.getElementById("itemQty").value)
  const price = Number.parseFloat(document.getElementById("itemPrice").value)

  if (!name || isNaN(qty) || isNaN(price) || qty <= 0 || price <= 0) {
    showNotification("Please enter valid item details", "error")
    return
  }

  // Check if item already exists
  const existingItem = stock.find((item) => item.name.toLowerCase() === name.toLowerCase())
  if (existingItem) {
    existingItem.qty += qty
    existingItem.price = price // Update price
    showNotification(`${name} quantity updated in inventory`, "success")
  } else {
    stock.push({ name, qty, price, id: Date.now() })
    showNotification(`${name} added to inventory`, "success")
  }

  renderStock()
  updateDeliveryItems()
  updateSalesItems()
  updateOverview()

  // Clear form
  document.getElementById("itemName").value = ""
  document.getElementById("itemQty").value = ""
  document.getElementById("itemPrice").value = ""
}

function renderStock() {
  const table = document.getElementById("stockTable")
  table.innerHTML = ""

  stock.forEach((item, index) => {
    const totalValue = item.qty * item.price
    const lowStock = item.qty < 10 ? 'style="background-color: rgba(255, 193, 7, 0.2);"' : ""

    table.innerHTML += `
      <tr ${lowStock}>
        <td>${item.name} ${item.qty < 10 ? '<i class="fas fa-exclamation-triangle text-warning" title="Low Stock"></i>' : ""}</td>
        <td>${item.qty}</td>
        <td>₱${item.price.toFixed(2)}</td>
        <td>₱${totalValue.toFixed(2)}</td>
        <td>
          <button class="btn btn-sm btn-warning me-1" onclick="editStock(${index})" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="removeStock(${index})" title="Remove">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`
  })
}

function removeStock(index) {
  if (confirm("Are you sure you want to remove this item?")) {
    const item = stock[index]
    stock.splice(index, 1)
    renderStock()
    updateDeliveryItems()
    updateSalesItems()
    updateOverview()
    showNotification(`${item.name} removed from inventory`, "success")
  }
}

function editStock(index) {
  const item = stock[index]
  const newQty = prompt("Enter new quantity:", item.qty)
  const newPrice = prompt("Enter new price:", item.price)

  if (newQty !== null && newPrice !== null) {
    const qty = Number.parseInt(newQty)
    const price = Number.parseFloat(newPrice)

    if (!isNaN(qty) && !isNaN(price) && qty >= 0 && price >= 0) {
      item.qty = qty
      item.price = price
      renderStock()
      updateOverview()
      showNotification("Item updated successfully", "success")
    } else {
      showNotification("Invalid values entered", "error")
    }
  }
}

// DELIVERY MANAGEMENT
function updateDeliveryItems() {
  const select = document.getElementById("deliveryItem")
  select.innerHTML = "<option selected disabled>Select Item</option>"
  stock.forEach((item) => {
    const option = document.createElement("option")
    option.value = item.name
    option.textContent = `${item.name} (${item.qty} available)`
    select.appendChild(option)
  })
}

function addDelivery() {
  const item = document.getElementById("deliveryItem").value
  const address = document.getElementById("deliveryAddress").value.trim()
  const customer = document.getElementById("customerName").value.trim()
  const status = document.getElementById("deliveryStatus").value

  if (!item || !address || !customer) {
    showNotification("Please fill in all delivery details", "error")
    return
  }

  deliveries.push({
    id: Date.now(),
    item,
    customer,
    address,
    status,
    date: new Date().toLocaleString(),
  })

  renderDeliveries()
  updateOverview()

  // Clear form
  document.getElementById("deliveryItem").value = ""
  document.getElementById("deliveryAddress").value = ""
  document.getElementById("customerName").value = ""
  document.getElementById("deliveryStatus").value = "pending"

  showNotification("Delivery added successfully", "success")
}

function renderDeliveries() {
  const table = document.getElementById("deliveryTable")
  table.innerHTML = ""

  deliveries.forEach((delivery, index) => {
    const statusClass =
      delivery.status === "delivered" ? "success" : delivery.status === "in-transit" ? "warning" : "secondary"

    table.innerHTML += `
      <tr>
        <td>${delivery.item}</td>
        <td>${delivery.customer}</td>
        <td>${delivery.address}</td>
        <td>
          <span class="badge bg-${statusClass}">${delivery.status}</span>
        </td>
        <td>
          <button class="btn btn-sm btn-info me-1" onclick="updateDeliveryStatus(${index})" title="Update Status">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-sm btn-danger" onclick="removeDelivery(${index})" title="Remove">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>`
  })
}

function updateDeliveryStatus(index) {
  const delivery = deliveries[index]
  const statuses = ["pending", "in-transit", "delivered"]
  const currentIndex = statuses.indexOf(delivery.status)
  const nextStatus = statuses[(currentIndex + 1) % statuses.length]

  if (confirm(`Update delivery status to "${nextStatus}"?`)) {
    delivery.status = nextStatus
    renderDeliveries()
    updateOverview()
    showNotification("Delivery status updated", "success")
  }
}

function removeDelivery(index) {
  if (confirm("Are you sure you want to remove this delivery?")) {
    const delivery = deliveries[index]
    deliveries.splice(index, 1)
    renderDeliveries()
    updateOverview()
    showNotification("Delivery removed", "success")
  }
}

// SALES MANAGEMENT
function updateSalesItems() {
  const select = document.getElementById("salesItem")
  select.innerHTML = "<option selected disabled>Select Item</option>"
  stock.forEach((item) => {
    if (item.qty > 0) {
      const option = document.createElement("option")
      option.value = item.name
      option.textContent = `${item.name} - ₱${item.price.toFixed(2)} (${item.qty} available)`
      select.appendChild(option)
    }
  })
}

function recordSale() {
  const itemName = document.getElementById("salesItem").value
  const qty = Number.parseInt(document.getElementById("salesQty").value)

  if (!itemName || isNaN(qty) || qty <= 0) {
    showNotification("Please select a valid item and quantity", "error")
    return
  }

  const stockItem = stock.find((item) => item.name === itemName)
  if (!stockItem) {
    showNotification("Item not found in stock", "error")
    return
  }

  if (stockItem.qty < qty) {
    showNotification(`Insufficient stock. Only ${stockItem.qty} available`, "error")
    return
  }

  // Update stock
  stockItem.qty -= qty

  // Record sale
  const total = qty * stockItem.price
  const sale = {
    id: Date.now(),
    item: itemName,
    qty,
    unitPrice: stockItem.price,
    total,
    date: new Date().toLocaleString(),
  }

  salesHistory.push(sale)

  // Update displays
  renderStock()
  renderSalesTable()
  updateSalesItems()
  updateOverview()
  showReceipt(sale)

  // Clear form
  document.getElementById("salesQty").value = ""

  showNotification(`Sale recorded: ${qty}x ${itemName}`, "success")
}

function showReceipt(sale) {
  const receiptContainer = document.getElementById("latestReceipt")
  const receiptContent = document.getElementById("receiptContent")

  receiptContent.innerHTML = `
    <div class="text-center mb-2">
      <strong>💧 AquaSpark Receipt</strong><br>
      <small>${sale.date}</small>
    </div>
    <hr style="border-color: #4caf50;">
    <div class="d-flex justify-content-between">
      <span>Item:</span>
      <span>${sale.item}</span>
    </div>
    <div class="d-flex justify-content-between">
      <span>Quantity:</span>
      <span>${sale.qty}</span>
    </div>
    <div class="d-flex justify-content-between">
      <span>Unit Price:</span>
      <span>₱${sale.unitPrice.toFixed(2)}</span>
    </div>
    <hr style="border-color: #4caf50;">
    <div class="d-flex justify-content-between">
      <strong>Total:</strong>
      <strong>₱${sale.total.toFixed(2)}</strong>
    </div>
    <div class="text-center mt-2">
      <small>Thank you for your business!</small>
    </div>
  `

  receiptContainer.style.display = "block"
}

function renderSalesTable() {
  const tbody = document.getElementById("salesTableBody")
  tbody.innerHTML = ""

  salesHistory
    .slice()
    .reverse()
    .forEach((sale) => {
      tbody.innerHTML += `
      <tr>
        <td>${sale.item}</td>
        <td>${sale.qty}</td>
        <td>₱${sale.unitPrice.toFixed(2)}</td>
        <td>₱${sale.total.toFixed(2)}</td>
        <td>${sale.date}</td>
      </tr>`
    })
}

function clearSales() {
  if (confirm("Are you sure you want to clear all sales history?")) {
    salesHistory.length = 0
    renderSalesTable()
    updateOverview()
    document.getElementById("latestReceipt").style.display = "none"
    showNotification("Sales history cleared", "success")
  }
}

function showDailySales() {
  const today = new Date().toLocaleDateString()
  const todaySales = salesHistory.filter((sale) => new Date(sale.date).toLocaleDateString() === today)

  const dailySalesData = document.getElementById("dailySalesData")

  if (todaySales.length === 0) {
    dailySalesData.innerHTML = `
      <div class="text-center">
        <i class="fas fa-chart-line fa-3x mb-3" style="color: #4caf50;"></i>
        <h4>No sales recorded for today</h4>
        <p>Start recording sales to see your daily report here.</p>
      </div>
    `
  } else {
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0)
    const totalItems = todaySales.reduce((sum, sale) => sum + sale.qty, 0)

    // Group sales by item
    const itemSummary = {}
    todaySales.forEach((sale) => {
      if (!itemSummary[sale.item]) {
        itemSummary[sale.item] = { qty: 0, revenue: 0 }
      }
      itemSummary[sale.item].qty += sale.qty
      itemSummary[sale.item].revenue += sale.total
    })

    dailySalesData.innerHTML = `
      <div class="row mb-4">
        <div class="col-md-4">
          <div class="stats-card">
            <div class="stats-value">₱${totalRevenue.toFixed(2)}</div>
            <div class="stats-label">Today's Revenue</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stats-card">
            <div class="stats-value">${totalItems}</div>
            <div class="stats-label">Items Sold</div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="stats-card">
            <div class="stats-value">${todaySales.length}</div>
            <div class="stats-label">Transactions</div>
          </div>
        </div>
      </div>
      
      <h5 class="mb-3">📊 Sales by Item</h5>
      <div class="table-responsive mb-4">
        <table class="table">
          <thead>
            <tr><th>Item</th><th>Quantity Sold</th><th>Revenue</th></tr>
          </thead>
          <tbody>
            ${Object.entries(itemSummary)
              .map(
                ([item, data]) => `
              <tr>
                <td>${item}</td>
                <td>${data.qty}</td>
                <td>₱${data.revenue.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
      
      <h5 class="mb-3">🕐 Transaction Timeline</h5>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr><th>Time</th><th>Item</th><th>Qty</th><th>Total</th></tr>
          </thead>
          <tbody>
            ${todaySales
              .map(
                (sale) => `
              <tr>
                <td>${new Date(sale.date).toLocaleTimeString()}</td>
                <td>${sale.item}</td>
                <td>${sale.qty}</td>
                <td>₱${sale.total.toFixed(2)}</td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `
  }

  showSection("dailySales")
}

// MAP FUNCTIONALITY
function initializeMap() {
  map = L.map("map").setView([14.5995, 120.9842], 10) // Manila coordinates
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map)

  // Add a default marker
  marker = L.marker([14.5995, 120.9842]).addTo(map).bindPopup("🏢 AquaSpark Headquarters").openPopup()
}

function locateOnMap() {
  const query = document.getElementById("truckLocationInput").value.trim()
  if (!query) {
    showNotification("Please enter coordinates", "error")
    return
  }

  try {
    const [lat, lng] = query.split(",").map(Number)
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      if (marker) map.removeLayer(marker)
      marker = L.marker([lat, lng]).addTo(map).bindPopup("🚚 Truck Location").openPopup()
      map.setView([lat, lng], 15)
      showNotification("Location updated on map", "success")
    } else {
      showNotification("Invalid coordinates. Latitude: -90 to 90, Longitude: -180 to 180", "error")
    }
  } catch {
    showNotification("Invalid coordinates format. Use: lat,lng (e.g., 14.5995,120.9842)", "error")
  }
}

function getCurrentLocation() {
  if (navigator.geolocation) {
    showNotification("Getting your location...", "info")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude
        const lng = position.coords.longitude
        document.getElementById("truckLocationInput").value = `${lat.toFixed(6)},${lng.toFixed(6)}`
        locateOnMap()
      },
      (error) => {
        let errorMessage = "Unable to get current location"
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location access denied by user"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable"
            break
          case error.TIMEOUT:
            errorMessage = "Location request timed out"
            break
        }
        showNotification(errorMessage, "error")
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      },
    )
  } else {
    showNotification("Geolocation is not supported by this browser", "error")
  }
}

// OVERVIEW UPDATES
function updateOverview() {
  // Total sales
  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.total, 0)
  document.getElementById("totalSales").textContent = `₱${totalSales.toFixed(2)}`

  // Total items in stock
  const totalItems = stock.reduce((sum, item) => sum + item.qty, 0)
  document.getElementById("totalItems").textContent = totalItems

  // Pending deliveries
  const pendingDeliveries = deliveries.filter((d) => d.status === "pending").length
  document.getElementById("pendingDeliveries").textContent = pendingDeliveries

  // Today's sales
  const today = new Date().toLocaleDateString()
  const todaySales = salesHistory
    .filter((sale) => new Date(sale.date).toLocaleDateString() === today)
    .reduce((sum, sale) => sum + sale.total, 0)
  document.getElementById("todaySales").textContent = `₱${todaySales.toFixed(2)}`

  // Update notification badges
  const lowStockItems = stock.filter((item) => item.qty < 10).length
  const notifications = pendingDeliveries + lowStockItems
  document.getElementById("notificationBadge").textContent = notifications
  document.getElementById("drawerNotificationBadge").textContent = notifications
}

// UTILITY FUNCTIONS
function exportData() {
  const data = {
    stock,
    deliveries,
    salesHistory,
    exportDate: new Date().toISOString(),
    summary: {
      totalSales: salesHistory.reduce((sum, sale) => sum + sale.total, 0),
      totalItems: stock.reduce((sum, item) => sum + item.qty, 0),
      pendingDeliveries: deliveries.filter((d) => d.status === "pending").length,
    },
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `aquaspark-data-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  showNotification("Data exported successfully", "success")
}

function backupData() {
  try {
    const backupData = {
      stock,
      deliveries,
      salesHistory,
      backupDate: new Date().toISOString(),
    }
    localStorage.setItem("aquaspark-backup", JSON.stringify(backupData))
    showNotification("Data backed up to local storage", "success")
  } catch (error) {
    showNotification("Failed to backup data", "error")
  }
}

function showSystemInfo() {
  const totalSales = salesHistory.reduce((sum, sale) => sum + sale.total, 0)
  const totalItems = stock.reduce((sum, item) => sum + item.qty, 0)

  alert(`💧 AquaSpark POS System v2.0

📊 System Statistics:
• Stock Items: ${stock.length}
• Total Inventory: ${totalItems} units
• Deliveries: ${deliveries.length}
• Sales Records: ${salesHistory.length}
• Total Revenue: ₱${totalSales.toFixed(2)}

🖥️ System Info:
• Browser: ${navigator.userAgent.split(" ")[0]}
• Platform: ${navigator.platform}
• Last Updated: ${new Date().toLocaleString()}

💾 Storage:
• Local Storage Available: ${typeof Storage !== "undefined" ? "Yes" : "No"}
• Geolocation Available: ${navigator.geolocation ? "Yes" : "No"}`)
}

function loadSampleData() {
  // Add some sample stock items
  stock.push(
    { name: "Water Gallon (5L)", qty: 50, price: 25.0, id: 1 },
    { name: "Water Bottle (1L)", qty: 100, price: 15.0, id: 2 },
    { name: "Water Bottle (500ml)", qty: 200, price: 10.0, id: 3 },
    { name: "Delivery Service", qty: 999, price: 50.0, id: 4 },
  )

  // Add sample deliveries
  deliveries.push(
    {
      id: 1,
      item: "Water Gallon (5L)",
      customer: "John Doe",
      address: "123 Main St, Manila",
      status: "pending",
      date: new Date().toLocaleString(),
    },
    {
      id: 2,
      item: "Water Bottle (1L)",
      customer: "Jane Smith",
      address: "456 Oak Ave, Quezon City",
      status: "in-transit",
      date: new Date().toLocaleString(),
    },
  )

  renderStock()
  renderDeliveries()
  updateDeliveryItems()
  updateSalesItems()
  updateOverview()
}

// Auto-save functionality
setInterval(() => {
  if (stock.length > 0 || deliveries.length > 0 || salesHistory.length > 0) {
    try {
      localStorage.setItem(
        "aquaspark-autosave",
        JSON.stringify({
          stock,
          deliveries,
          salesHistory,
          lastSave: new Date().toISOString(),
        }),
      )
    } catch (error) {
      console.warn("Auto-save failed:", error)
    }
  }
}, 30000) // Auto-save every 30 seconds

// Load auto-saved data on page load
window.addEventListener("load", () => {
  try {
    const autoSave = localStorage.getItem("aquaspark-autosave")
    if (autoSave) {
      const data = JSON.parse(autoSave)
      if (data.stock && data.deliveries && data.salesHistory) {
        const loadAutoSave = confirm("Auto-saved data found. Would you like to restore it?")
        if (loadAutoSave) {
          stock = data.stock
          deliveries = data.deliveries
          salesHistory = data.salesHistory

          renderStock()
          renderDeliveries()
          renderSalesTable()
          updateDeliveryItems()
          updateSalesItems()
          updateOverview()

          showNotification("Auto-saved data restored", "success")
        }
      }
    }
  } catch (error) {
    console.warn("Failed to load auto-saved data:", error)
  }
})
