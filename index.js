// Hide priority-only column initially
$('.priority-only').hide();
$('#quantumParagraph').hide();

$(document).ready(function () {
  $('input[type=radio][name=algorithm]').change(function () {
    if (this.value == 'priority') {
      $('.priority-only').show();
      $('#minus').css('left', '604px');
    }
    else {
      $('.priority-only').hide();
      $('#minus').css('left', '428px');
    }

    if (this.value == 'robin') {
      $('#quantumParagraph').show();
    }
    else {
      $('#quantumParagraph').hide();
    }
  });
});

function addRow() {
  var lastRow = $('#inputTable tr:last');
  var lastRowNumebr = parseInt(lastRow.children()[0].innerText.substring(1));

  var newRow = '<tr><td>P'
    + (lastRowNumebr + 1)
    + '</td><td><input class="arrivaltime" type="text" value="0"/></td><td><input class="exectime" type="text" value="1"/></td>'
    + '<td class="priority-only"><input type="text" value="1"/></td></tr>';

  lastRow.after(newRow);

  var minus = $('#minus');
  minus.show();
  minus.css('top', (parseFloat(minus.css('top')) + 24) + 'px');

  if ($('input[name=algorithm]:checked', '#algorithm').val() != "priority")
    $('.priority-only').hide();

  $('#inputTable tr:last input').change(function () {
    // Add event listener to the new inputs
  });
}

function deleteRow() {
  if ($('#inputTable tr').length <= 3) {
    return; // Don't delete if only 2 rows remain (+ header)
  }
  
  var lastRow = $('#inputTable tr:last');
  lastRow.remove();

  var minus = $('#minus');
  minus.css('top', (parseFloat(minus.css('top')) - 24) + 'px');

  if (parseFloat(minus.css('top')) < 150)
    minus.hide();
}

$(".initial").change(function () {
  // Event listener for input changes
});

function animationStep(steps, cur) {
  $('#timer').html(cur);
  
  // Update the progress bar
  const progressPercentage = (cur / steps) * 100;
  $('#progressBar').css('width', `${progressPercentage}%`);
  
  if(cur < steps) {
    setTimeout(function(){ 
      animationStep(steps, cur + 1);
    }, 500);
  } else {
    // Animation complete - show completion message
    $('#completionMessage').fadeIn(500).delay(2000).fadeOut(500);
  }
}

function sortProcessesByArrival(processes) {
  return [...processes].sort((a, b) => {
    if (a.arrivalTime === b.arrivalTime) {
      return a.P - b.P;
    }
    return a.arrivalTime - b.arrivalTime;
  });
}

function draw() {
  $('fresh').html('');
  var inputTable = $('#inputTable tr');
  var algorithm = $('input[name=algorithm]:checked', '#algorithm').val();
  var executionSequence = [];
  
  // Common function to collect processes from input table (with or without priority)
  function collectProcesses(includePriority = false) {
    var processes = [];
    $.each(inputTable, function (key, value) {
      if (key == 0) return true; // Skip header
      var arrivalTime = parseInt($(value.children[1]).children().first().val());
      var executeTime = parseInt($(value.children[2]).children().first().val());
      let process = { 
        "arrivalTime": arrivalTime, 
        "executeTime": executeTime, 
        "P": key - 1,
        "remainingTime": executeTime,
        "completed": false
      };
      
      if (includePriority) {
        process.priority = parseInt($(value.children[3]).children().first().val());
      }
      
      processes.push(process);
    });
    return processes;
  }
  
  // Generate visualization HTML from execution sequence
  function generateVisualization(executionSequence) {
    // Get color for process
    function getProcessColor(id) {
      // Color palette for processes
      const colors = [
        '#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', 
        '#1abc9c', '#d35400', '#c0392b', '#16a085', '#8e44ad'
      ];
      return colors[id % colors.length];
    }
    
    let visualizationHTML = '<div class="visualization-container">';
    
    // Create the Gantt chart
    visualizationHTML += '<div class="gantt-chart">';
    
    // Process blocks
    executionSequence.forEach(item => {
      const width = item.duration * 20; // Scale consistently
      const left = item.startTime * 20; // Position based on start time
      
      let bgColor, textColor, label;
      
      if (item.type === "idle") {
        bgColor = "#444";
        textColor = "#fff";
        label = "Idle";
      } else {
        bgColor = getProcessColor(item.id);
        textColor = "#fff";
        label = "P" + item.id;
      }
      
      visualizationHTML += `
        <div class="process-block" style="
          left: ${left}px;
          width: ${width}px;
          background-color: ${bgColor};
          color: ${textColor};
        ">
          <span class="process-label">${label}</span>
          <span class="duration-label">${item.duration}</span>
        </div>
      `;
    });
    
    visualizationHTML += '</div>'; // End gantt-chart
    
    // Create the timeline
    visualizationHTML += '<div class="timeline">';
    
    // Timeline markers
    let currentTime = 0;
    executionSequence.forEach(item => {
      visualizationHTML += `
        <div class="timeline-marker" style="left: ${currentTime * 20}px;">
          <div class="timeline-tick"></div>
          <div class="timeline-label">${currentTime}</div>
        </div>
      `;
      currentTime += item.duration;
    });
    
    // Add final marker
    visualizationHTML += `
      <div class="timeline-marker" style="left: ${currentTime * 20}px;">
        <div class="timeline-tick"></div>
        <div class="timeline-label">${currentTime}</div>
      </div>
    `;
    
    visualizationHTML += '</div>'; // End timeline
    
    // Add process statistics section
    visualizationHTML += '<div class="process-stats-container">';
    visualizationHTML += '<h3>Process Statistics</h3>';
    visualizationHTML += '<div class="process-stats">';
    
    // Calculate statistics from the execution sequence
    const processStats = {};
    
    // Initialize processes
    executionSequence.forEach(item => {
      if (item.type === "process") {
        if (!processStats[item.id]) {
          processStats[item.id] = {
            id: item.id,
            color: getProcessColor(item.id),
            startTime: Infinity,
            endTime: 0,
            burstTime: 0
          };
        }
      }
    });
    
    // Calculate stats
    executionSequence.forEach(item => {
      if (item.type === "process") {
        const stats = processStats[item.id];
        stats.startTime = Math.min(stats.startTime, item.startTime);
        stats.endTime = Math.max(stats.endTime, item.startTime + item.duration);
        stats.burstTime += item.duration;
      }
    });
    
    // Convert to array and sort by process ID
    const processStatsArray = Object.values(processStats).sort((a, b) => a.id - b.id);
    
    // Display stats in a table
    visualizationHTML += '<table class="stats-table">';
    visualizationHTML += '<tr><th>Process</th><th>Start Time</th><th>End Time</th><th>Burst Time</th><th>Turnaround Time</th><th>Waiting Time</th></tr>';
    
    processStatsArray.forEach(stats => {
      const turnaroundTime = stats.endTime - stats.startTime;
      const waitingTime = turnaroundTime - stats.burstTime;
      
      visualizationHTML += `
        <tr>
          <td><span class="process-indicator" style="background-color: ${stats.color}"></span> P${stats.id}</td>
          <td>${stats.startTime}</td>
          <td>${stats.endTime}</td>
          <td>${stats.burstTime}</td>
          <td>${turnaroundTime}</td>
          <td>${waitingTime}</td>
        </tr>
      `;
    });
    
    visualizationHTML += '</table>';
    visualizationHTML += '</div>'; // End process-stats
    visualizationHTML += '</div>'; // End process-stats-container
    
    // Add animation controls and progress
    visualizationHTML += `
      <div class="animation-controls">
        <div class="progress-container">
          <div id="progressBar" class="progress-bar"></div>
        </div>
        <div id="completionMessage" class="completion-message">Simulation Complete!</div>
      </div>
    `;
    
    visualizationHTML += '</div>'; // End visualization-container
    
    return visualizationHTML;
  }

  if (algorithm == "fcfs") {
    var processes = collectProcesses();
    processes = sortProcessesByArrival(processes);
    
    var currentTime = 0;
    
    // Process all jobs according to arrival time
    for (let i = 0; i < processes.length; i++) {
      let process = processes[i];
      
      // If there's a gap between current time and next process arrival
      if (currentTime < process.arrivalTime) {
        executionSequence.push({ 
          type: "idle", 
          duration: process.arrivalTime - currentTime,
          startTime: currentTime
        });
        currentTime = process.arrivalTime;
      }
      
      // Execute the process
      executionSequence.push({ 
        type: "process", 
        id: process.P, 
        duration: process.executeTime,
        startTime: currentTime
      });
      
      currentTime += process.executeTime;
    }
  }
  else if (algorithm == "sjf") {
    var processes = collectProcesses();
    
    var currentTime = 0;
    var completedProcesses = 0;
    
    // Continue until all processes are completed
    while (completedProcesses < processes.length) {
      // Find processes that have arrived by current time and are not completed
      let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.completed);
      
      if (availableProcesses.length === 0) {
        // No process available, find next arrival time
        let nextArrival = Infinity;
        let nextProcess = null;
        
        for (let i = 0; i < processes.length; i++) {
          if (!processes[i].completed && processes[i].arrivalTime < nextArrival) {
            nextArrival = processes[i].arrivalTime;
            nextProcess = processes[i];
          }
        }
        
        // Add idle time until next arrival
        if (nextProcess) {
          executionSequence.push({
            type: "idle",
            duration: nextArrival - currentTime,
            startTime: currentTime
          });
          currentTime = nextArrival;
        } else {
          break; // Something went wrong
        }
      } else {
        // Find the shortest job among available processes
        availableProcesses.sort((a, b) => {
          if (a.executeTime === b.executeTime) {
            return a.arrivalTime - b.arrivalTime;
          }
          return a.executeTime - b.executeTime;
        });
        
        let shortestJob = availableProcesses[0];
        let processIndex = processes.findIndex(p => p.P === shortestJob.P);
        
        // Execute the process
        executionSequence.push({
          type: "process",
          id: shortestJob.P,
          duration: shortestJob.executeTime,
          startTime: currentTime
        });
        
        currentTime += shortestJob.executeTime;
        processes[processIndex].completed = true;
        completedProcesses++;
      }
    }
  }
  else if (algorithm == "srtf") {
    var processes = collectProcesses();
    processes = sortProcessesByArrival(processes);
    
    var currentTime = 0;
    var completedProcesses = 0;
    
    // Create arrays to track all events (arrivals and potential preemptions)
    let events = [];
    processes.forEach(p => {
      events.push({ time: p.arrivalTime, type: 'arrival', process: p.P });
    });
    events.sort((a, b) => a.time - b.time);
    
    // If no process at time 0, advance to first arrival
    if (events.length > 0 && events[0].time > 0) {
      executionSequence.push({
        type: "idle",
        duration: events[0].time,
        startTime: 0
      });
      currentTime = events[0].time;
    }
    
    let currentProcess = null;
    let currentProcessIndex = -1;
    
    // Process until all jobs complete
    while (completedProcesses < processes.length) {
      // Find arrived but not completed processes
      let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.completed);
      
      if (availableProcesses.length === 0) {
        // No process available, find next arrival
        let nextArrival = Infinity;
        let nextProcess = null;
        
        for (let i = 0; i < processes.length; i++) {
          if (!processes[i].completed && processes[i].arrivalTime < nextArrival) {
            nextArrival = processes[i].arrivalTime;
            nextProcess = processes[i];
          }
        }
        
        // Add idle time
        if (nextProcess) {
          executionSequence.push({
            type: "idle",
            duration: nextArrival - currentTime,
            startTime: currentTime
          });
          currentTime = nextArrival;
        } else {
          break; // Something went wrong
        }
        
        continue;
      }
      
      // Find shortest remaining time process
      availableProcesses.sort((a, b) => {
        if (a.remainingTime === b.remainingTime) {
          return a.arrivalTime - b.arrivalTime;
        }
        return a.remainingTime - b.remainingTime;
      });
      
      // Get the process with shortest remaining time
      currentProcess = availableProcesses[0];
      currentProcessIndex = processes.findIndex(p => p.P === currentProcess.P);
      
      // Find next event time (either a new process arrival or completion of current process)
      let nextEventTime = Infinity;
      
      // Find next arrival after current time
      for (let i = 0; i < processes.length; i++) {
        if (!processes[i].completed && processes[i].arrivalTime > currentTime) {
          nextEventTime = Math.min(nextEventTime, processes[i].arrivalTime);
        }
      }
      
      // Calculate how long the current process can run
      let runTime;
      if (nextEventTime !== Infinity) {
        // Run until next event or completion, whichever comes first
        runTime = Math.min(currentProcess.remainingTime, nextEventTime - currentTime);
      } else {
        // No more arrivals, run until completion
        runTime = currentProcess.remainingTime;
      }
      
      // Execute the process for the calculated time
      executionSequence.push({
        type: "process",
        id: currentProcess.P,
        duration: runTime,
        startTime: currentTime
      });
      
      // Update process and time
      processes[currentProcessIndex].remainingTime -= runTime;
      currentTime += runTime;
      
      // Check if process completed
      if (processes[currentProcessIndex].remainingTime === 0) {
        processes[currentProcessIndex].completed = true;
        completedProcesses++;
      }
    }
    
    // Merge consecutive segments for the same process
    for (let i = 0; i < executionSequence.length - 1; i++) {
      if (executionSequence[i].type === "process" && 
          executionSequence[i+1].type === "process" &&
          executionSequence[i].id === executionSequence[i+1].id) {
        executionSequence[i].duration += executionSequence[i+1].duration;
        executionSequence.splice(i+1, 1);
        i--; // Check again with the new next element
      }
    }
  }
  else if (algorithm == "priority") {
    var processes = collectProcesses(true); // Include priority

    var currentTime = 0;
    var completedProcesses = 0;
    
    // Continue until all processes are completed
    while (completedProcesses < processes.length) {
      // Find arrived but uncompleted processes
      let availableProcesses = processes.filter(p => p.arrivalTime <= currentTime && !p.completed);
      
      if (availableProcesses.length === 0) {
        // No process available, find next arrival
        let nextArrival = Infinity;
        let nextProcess = null;
        
        for (let i = 0; i < processes.length; i++) {
          if (!processes[i].completed && processes[i].arrivalTime < nextArrival) {
            nextArrival = processes[i].arrivalTime;
            nextProcess = processes[i];
          }
        }
        
        // Add idle time
        if (nextProcess) {
          executionSequence.push({
            type: "idle",
            duration: nextArrival - currentTime,
            startTime: currentTime
          });
          currentTime = nextArrival;
        } else {
          break; // Something went wrong
        }
      } else {
        // Sort by priority (higher priority first)
        availableProcesses.sort((a, b) => {
          if (a.priority === b.priority) {
            return a.arrivalTime - b.arrivalTime;
          }
          return b.priority - a.priority; // Higher number = higher priority
        });
        
        let highestPriorityProcess = availableProcesses[0];
        let processIndex = processes.findIndex(p => p.P === highestPriorityProcess.P);
        
        // Execute the process
        executionSequence.push({
          type: "process",
          id: highestPriorityProcess.P,
          duration: highestPriorityProcess.executeTime,
          startTime: currentTime
        });
        
        currentTime += highestPriorityProcess.executeTime;
        processes[processIndex].completed = true;
        completedProcesses++;
      }
    }
  }
  else if (algorithm == "robin") {
    var quantum = parseInt($('#quantum').val());
    var processes = collectProcesses();
    processes = sortProcessesByArrival(processes);
    
    // Add inQueue property to all processes
    processes.forEach(p => p.inQueue = false);
    
    var currentTime = 0;
    var completedProcesses = 0;
    var readyQueue = [];
    
    // Add first arrived process(es) to the queue
    for (let i = 0; i < processes.length; i++) {
      if (processes[i].arrivalTime <= currentTime) {
        readyQueue.push(processes[i]);
        processes[i].inQueue = true;
      }
    }
    
    // If no processes at time 0, advance to first arrival
    if (readyQueue.length === 0) {
      let earliestArrival = processes[0].arrivalTime;
      executionSequence.push({
        type: "idle",
        duration: earliestArrival - currentTime,
        startTime: currentTime
      });
      currentTime = earliestArrival;
      readyQueue.push(processes[0]);
      processes[0].inQueue = true;
    }
    
    // Continue until all processes are completed
    while (completedProcesses < processes.length) {
      if (readyQueue.length === 0) {
        // Find next arriving process
        let nextArrival = Infinity;
        let nextProcess = null;
        
        for (let i = 0; i < processes.length; i++) {
          if (!processes[i].completed && processes[i].arrivalTime < nextArrival && !processes[i].inQueue) {
            nextArrival = processes[i].arrivalTime;
            nextProcess = processes[i];
          }
        }
        
        if (nextProcess) {
          // Add idle time
          executionSequence.push({
            type: "idle",
            duration: nextArrival - currentTime,
            startTime: currentTime
          });
          currentTime = nextArrival;
          
          // Add the process to queue
          readyQueue.push(nextProcess);
          let processIndex = processes.findIndex(p => p.P === nextProcess.P);
          processes[processIndex].inQueue = true;
        } else {
          break; // Something went wrong
        }
      } else {
        // Get the first process from queue
        let currentProcess = readyQueue.shift();
        let processIndex = processes.findIndex(p => p.P === currentProcess.P);
        processes[processIndex].inQueue = false;
        
        // Calculate execution time for this quantum
        let executionTime = Math.min(quantum, processes[processIndex].remainingTime);
        
        // Execute the process
        executionSequence.push({
          type: "process",
          id: currentProcess.P,
          duration: executionTime,
          startTime: currentTime
        });
        
        // Update time and process
        currentTime += executionTime;
        processes[processIndex].remainingTime -= executionTime;
        
        // Check for newly arrived processes during this time quantum
        for (let i = 0; i < processes.length; i++) {
          if (!processes[i].completed && 
              !processes[i].inQueue && 
              processes[i].arrivalTime > currentTime - executionTime && 
              processes[i].arrivalTime <= currentTime) {
            readyQueue.push(processes[i]);
            processes[i].inQueue = true;
          }
        }
        
        // Check if process is completed
        if (processes[processIndex].remainingTime === 0) {
          processes[processIndex].completed = true;
          completedProcesses++;
        } else {
          // Put the process back at the end of queue
          readyQueue.push(processes[processIndex]);
          processes[processIndex].inQueue = true;
        }
      }
    }
  }
  
  // Generate main visualization
  let visualizationHTML = generateVisualization(executionSequence);
  
  // Add the visualization to the page
  $('fresh').html(visualizationHTML);
  
  // Calculate total time for animation
  var totalTime = 0;
  executionSequence.forEach(item => {
    totalTime += item.duration;
  });
  
  // Display total time
  $('#timer').html(totalTime);
  
  // Start the animation
  animationStep(totalTime, 0);
  
  // Fade in the visualization
  $('.visualization-container').css('opacity', 0).animate({
    opacity: 1
  }, 500);
}