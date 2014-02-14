using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Drawing;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace VT3Controls
{
    public partial class Scroller : UserControl
    {
        string _scrollerText;
        public string ScrollerText
        {
            get { return _scrollerText; }
            set
            {
                _scrollerText = value;
                textSize = TextRenderer.MeasureText(value, font);
            }
        }

        Point textPosition;
        Font font;
        int textPositionYIncrement;
        Size textSize;
        

        public Scroller()
        {
            InitializeComponent();

            textPosition = new Point(ClientSize.Width, 0);
            textPositionYIncrement = 2;
            font = new Font("Verdana", 10);

            components = new System.ComponentModel.Container();
            var timer = new System.Windows.Forms.Timer(this.components);
            timer.Interval = 30;
            timer.Tick += new System.EventHandler(timer1_Tick);
            timer.Enabled = true;
        }

        protected override void OnPaint(PaintEventArgs e)
        {
            e.Graphics.DrawString(ScrollerText, font, Brushes.White, textPosition);
        }

        private void timer1_Tick(object sender, EventArgs e)
        {
            textPosition.X -= 2;
            textPosition.Y += textPositionYIncrement;

            if (textPosition.X < -textSize.Width)
            {
                textPosition.X = ClientSize.Width;
                textPosition.Y = 0;
                textPositionYIncrement = Math.Abs(textPositionYIncrement);
            }

            if ((textPositionYIncrement > 0 && textPosition.Y >= ClientSize.Height - textSize.Height)
                || (textPositionYIncrement < 0 && textPosition.Y <= 0))
            {
                textPositionYIncrement *= -1;
            }

            Invalidate();
        }
    }
}
