

int screenWidth = 600;
int screenHeight = 800;

Button button;
Data data;
Bar_Graph bar;
Line_Graph line;
Pie_Chart pie;
int line_state;
int bar_state;
int pie_state;

void setup() {
    size(screenWidth, screenHeight);
    if (frame != null) {
      frame.setResizable(true);
    }
    
    String file = "data.csv";
    
    //Parse data
    data = new Data();
    data.parse(file);
    
    //Set up button
    button = new Button();
    line_state = 0;
    button.add_state("Line Graph", 100, 20, width-110, 10, color(200, 50, 200));
    bar_state = 1;
    button.add_state("Bar Chart", 100, 20, width-110, 10, color(150, 150, 150));
    pie_state = 2;
    button.add_state("Pie Chart", 100, 20, width-110, 10, color(100, 100, 255));
    
    
    //Set up graphs;
    bar = new Bar_Graph(data);
    line = new Line_Graph(data);
    pie = new Pie_Chart(data);
    
}

void draw() {
  background(255, 255, 255);
  button.draw_button();
  int curr_state = button.getState();
  
  if (curr_state == 0) {
    //CHANGE THIS BACK TO LINE
      line.draw_graph();
  } else if (curr_state == 1) {
      bar.draw_graph();
  } else if (curr_state == 2) {
      pie.draw_graph(); 
  }
  
}

void mouseClicked() {
    button.intersect(mouseX, mouseY);
}

void mouseMoved() {
  
  int curr_state = button.getState();
   
   if (curr_state == bar_state) {
     bar.bar_intersect(mouseX, mouseY);
   } else {
     line.point_intersect(mouseX, mouseY);  
   }
   
     
}
