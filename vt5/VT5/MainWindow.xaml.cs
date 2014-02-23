using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace VT5
{
    /// <summary>
    /// Interaction logic for MainWindow.xaml
    /// </summary>
    public partial class MainWindow : Window
    {
        private List<Henkilo> henkilot;

        public List<Henkilo> Henkilot
        {
            get { return henkilot; }
            set { henkilot = value; }
        }

        public MainWindow()
        {
            henkilot = new List<Henkilo>();
            for (int i = 0; i < 25; i++)
            {
                henkilot.Add(new Henkilo());
            }

            InitializeComponent();
        }
    }

    public class Henkilo
    {
        private string etunimi;
        private string sukunimi;
        private int ika = 1;
        private string kansallisuus;
        private static Random r = new Random();
        public Henkilo()
        {
            string[] etunimet = { "John", "Jane", "Jack", "Tom", "Jules", "Jake", "Maria", "Jon", "Michael", "Julia" };
            string[] sukunimet = { "Doe", "", "Jones", "Thatcher", "Brown", "Williams", "Patterson", "Johnson", "Churchill", "Robinson" };
            string[] kansat = { "Skotlanti", "Uusi-Seelanti", "Känädä" };

            Ika = r.Next(1, 130);
            Etunimi = etunimet[r.Next(0, etunimet.Length)];
            Sukunimi = sukunimet[r.Next(0, sukunimet.Length)];
            Kansallisuus = kansat[r.Next(0, kansat.Length)];
        }

        public string Kansallisuus
        {
            get { return kansallisuus; }
            set { kansallisuus = value; }
        }

        public string Etunimi
        {
            get { return etunimi; }
            set { etunimi = value; }
        }

        public string Sukunimi
        {
            get { return sukunimi; }
            set { sukunimi = value; }
        }

        public int Ika
        {
            get { return ika; }
            set { if (value > 0 && value <= 130) ika = value; }
        }
    }
}
