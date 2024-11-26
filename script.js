// Adzuna API Credentials
const adzunaAppId = "941dda42";
const adzunaAppKey = "a6fbe4ab630ea848a238d33736f0770c";

let jobMap; // To hold the Leaflet map instance
let jobChart; // To hold the Chart.js instance

// Fetch Job Data from Adzuna API
async function fetchJobs(jobTitle, location) {
    const endpoint = `https://api.adzuna.com/v1/api/jobs/ca/search/1?app_id=${adzunaAppId}&app_key=${adzunaAppKey}&what=${jobTitle}&where=${location}`;
    const results = document.getElementById("job-results");
    results.innerHTML = "<p>Loading jobs...</p>"; // Show loading indicator

    try {
        const response = await fetch(endpoint);
        const data = await response.json();
        if (data.results) {
            displayJobs(data.results); // Display job listings
            generateChart(data.results); // Generate job trends chart
            plotJobsOnMap(data.results); // Plot jobs on the map
        } else {
            results.innerHTML = "<p>No jobs found for your search.</p>";
        }
    } catch (error) {
        console.error("Error fetching jobs:", error);
        results.innerHTML = "<p>Failed to fetch jobs. Please try again later.</p>";
    }
}

// Display Job Data
function displayJobs(jobs) {
    const results = document.getElementById("job-results");
    results.innerHTML = ""; // Clear previous results

    if (!jobs || jobs.length === 0) {
        results.innerHTML = "<p>No jobs found for your search.</p>";
        return;
    }

    jobs.forEach((job) => {
        const jobElement = document.createElement("div");
        jobElement.classList.add("job");
        jobElement.innerHTML = `
            <h3>${job.title}</h3>
            <p><strong>Company:</strong> ${job.company.display_name}</p>
            <p><strong>Location:</strong> ${job.location.display_name}</p>
            <p><strong>Salary:</strong> $${job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max}` : "Not specified"}</p>
            <p><strong>Description:</strong> ${job.description || "No description provided."}</p>
            <a href="${job.redirect_url}" target="_blank">View Job</a>
        `;
        results.appendChild(jobElement);
    });
}

// Generate Chart for Job Trends
function generateChart(jobs) {
    // Extract job titles and clean them
    const jobTitles = jobs.map((job) => job.title.trim());

    // Count occurrences of each unique job title
    const titleCounts = jobTitles.reduce((acc, title) => {
        acc[title] = (acc[title] || 0) + 1;
        return acc;
    }, {});

    // Prepare data for the chart
    const labels = Object.keys(titleCounts);
    const data = Object.values(titleCounts);

    const ctx = document.getElementById("job-chart").getContext("2d");

    // Destroy the previous chart instance if it exists
    if (jobChart) {
        jobChart.destroy();
    }

    // Create a new chart instance
    jobChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Job Listings",
                    data: data,
                    backgroundColor: "rgba(54, 162, 235, 0.5)",
                    borderColor: "rgba(54, 162, 235, 1)",
                    borderWidth: 1,
                },
            ],
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false,
                },
            },
            scales: {
                x: {
                    beginAtZero: true,
                },
                y: {
                    beginAtZero: true,
                },
            },
        },
    });
}

// Plot Jobs on Map using Leaflet
function plotJobsOnMap(jobs) {
    // Destroy the previous map instance if it exists
    if (jobMap) {
        jobMap.remove();
    }

    // Create a new map instance
    jobMap = L.map("job-map").setView([43.65107, -79.347015], 13); // Default to Toronto
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(jobMap);

    jobs.forEach((job) => {
        if (job.latitude && job.longitude) {
            L.marker([job.latitude, job.longitude])
                .addTo(jobMap)
                .bindPopup(
                    `<b>${job.title}</b><br>${job.company.display_name}<br>${job.location.display_name}`
                );
        }
    });
}

// Event Listener for Job Search Form
document.getElementById("job-form").addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent page refresh
    const jobTitle = document.getElementById("job-title").value.trim();
    const location = document.getElementById("location").value.trim();

    if (jobTitle && location) {
        fetchJobs(jobTitle, location);
        fetchCurrencyRates(); // Fetch currency rates alongside jobs
    } else {
        alert("Please fill in both the job title and location fields.");
    }
});
