
int screenWidth = 400;
int screenHeight = 300;

Button button;
Line line;

void setup () {
    size (screenWidth, screenHeight);
    String file = "data1.csv";
    
    button = new Button(screenHeight, screenWidth, file);
    line = new Line();
}

void draw () {
    background(255, 255, 255);
    if (button.getIsect() == true) {
        button.update();
    }
    
    button.draw_button();
    line.draw_line();
    
}

void mouseClicked() {
    button.intersect(mouseX, mouseY);
}
